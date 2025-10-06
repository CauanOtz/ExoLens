# train.py
import torch
import torch.nn as nn
import numpy as np
from torch.utils.data import DataLoader, Dataset
from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.metrics import precision_recall_curve, auc, roc_auc_score, accuracy_score, f1_score
import argparse
from dataset import LC_Dataset
from models import FullModel
from tqdm import tqdm
import os

def train_epoch(model, loader, opt, scaler, device, loss_fn):
    model.train()
    total_loss = 0.0
    for x,y in loader:
        x = x.to(device)
        y = y.to(device)
        opt.zero_grad()
        with torch.cuda.amp.autocast(enabled=scaler is not None):
            logits = model(x)
            loss = loss_fn(logits, y)
        if scaler is not None:
            scaler.scale(loss).backward()
            scaler.step(opt)
            scaler.update()
        else:
            loss.backward()
            opt.step()
        total_loss += float(loss.item()) * x.size(0)
    return total_loss / len(loader.dataset)

class CatalogDataset(Dataset):
    def __init__(self, X, y, indices=None):
        if indices is not None:
            self.X = X[indices]
            self.y = y[indices]
        else:
            self.X = X
            self.y = y
    def __len__(self):
        return len(self.X)
    def __getitem__(self, idx):
        return torch.tensor(self.X[idx], dtype=torch.float32), torch.tensor(self.y[idx], dtype=torch.long)

def eval_model(model, loader, device):
    model.eval()
    ys = []
    ps = []
    with torch.no_grad():
        for x,y in loader:
            x = x.to(device)
            logits = model(x)
            prob = torch.softmax(logits, dim=1)[:,1].detach().cpu().numpy()
            ps.append(prob)
            ys.append(y.numpy())
    y_true = np.concatenate(ys)
    p = np.concatenate(ps)
    # metrics
    pr, rc, _ = precision_recall_curve(y_true, p)
    pr_auc = auc(rc, pr)   # note: auc expects x,y but we keep as auc(recall,precision) -> PR AUC
    roc = roc_auc_score(y_true, p)
    p_bin = (p >= 0.5).astype(int)
    acc = accuracy_score(y_true, p_bin)
    f1 = f1_score(y_true, p_bin)
    return {'pr_auc':pr_auc, 'roc_auc':roc, 'acc':acc, 'f1':f1, 'y_true':y_true, 'p':p}

def main(args):
    npz = args.npz
    data = np.load(npz)
    X = data['X']
    y = data['y']
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # Determine if using catalog features
    catalog_only = args.catalog_only or (X.shape[1] > 1000)  # Heuristic: catalog features are many

    # train/val split
    train_idx, val_idx = train_test_split(np.arange(len(y)), test_size=0.2, stratify=y, random_state=42)

    if catalog_only:
        # For catalog features, create simple dataset
        train_ds = CatalogDataset(X, y, train_idx)
        val_ds = CatalogDataset(X, y, val_idx)
        train_loader = DataLoader(train_ds, batch_size=64, shuffle=True, num_workers=4)
        val_loader = DataLoader(val_ds, batch_size=128, shuffle=False, num_workers=4)
        n_features = X.shape[1]
    else:
        train_ds = LC_Dataset(npz, indices=train_idx, augment=True)
        val_ds = LC_Dataset(npz, indices=val_idx, augment=False)
        train_loader = DataLoader(train_ds, batch_size=64, shuffle=True, num_workers=4)
        val_loader = DataLoader(val_ds, batch_size=128, shuffle=False, num_workers=4)
        n_features = 0

    model = FullModel(seq_len=X.shape[1], n_tab_features=n_features, catalog_only=catalog_only).to(device)
    opt = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-5)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(opt, mode='max', factor=0.5, patience=4)
    scaler = torch.cuda.amp.GradScaler() if torch.cuda.is_available() else None

    # class weights for imbalance
    from collections import Counter
    c = Counter(y[train_idx])
    w0 = len(train_idx) / (2*c[0])
    w1 = len(train_idx) / (2*c[1])
    weights = torch.tensor([w0, w1], dtype=torch.float32).to(device)
    loss_fn = nn.CrossEntropyLoss(weight=weights)

    best_metric = 0.0
    patience = 10
    wait = 0
    for epoch in range(1, args.epochs+1):
        train_loss = train_epoch(model, train_loader, opt, scaler, device, loss_fn)
        stats = eval_model(model, val_loader, device)
        val_metric = stats['pr_auc']  # optimize PR-AUC
        scheduler.step(val_metric)
        print(f"Epoch {epoch} train_loss {train_loss:.4f} val_pr_auc {stats['pr_auc']:.4f} roc {stats['roc_auc']:.4f} f1 {stats['f1']:.4f}")
        if val_metric > best_metric:
            best_metric = val_metric
            torch.save(model.state_dict(), args.save)
            print("Saved best:", args.save)
            wait = 0
        else:
            wait += 1
            if wait >= patience:
                print("Early stopping")
                break

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--npz', required=True)
    parser.add_argument('--epochs', type=int, default=50)
    parser.add_argument('--save', default='best_model.pth')
    parser.add_argument('--catalog-only', action='store_true', help='Use catalog features only (no light curves)')
    args = parser.parse_args()
    main(args)