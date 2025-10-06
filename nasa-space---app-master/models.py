# models.py
import torch
import torch.nn as nn
import torch.nn.functional as F

class ConvBlock(nn.Module):
    def __init__(self, in_ch, out_ch, k, p):
        super().__init__()
        self.conv = nn.Conv1d(in_ch, out_ch, kernel_size=k, padding=p)
        self.bn = nn.BatchNorm1d(out_ch)
        self.act = nn.ReLU()
    def forward(self,x):
        return self.act(self.bn(self.conv(x)))

class TimeCNN(nn.Module):
    def __init__(self, in_len):
        super().__init__()
        self.net = nn.Sequential(
            ConvBlock(1, 32, 7, 3),
            nn.MaxPool1d(2),
            ConvBlock(32, 64, 5, 2),
            nn.MaxPool1d(2),
            ConvBlock(64, 128, 3, 1),
            nn.AdaptiveAvgPool1d(1),
            nn.Flatten(),
            nn.Linear(128, 128),
            nn.ReLU()
        )
    def forward(self, x):
        return self.net(x)  # (B, 128)

class SimpleTransformer(nn.Module):
    def __init__(self, seq_len, d_model=64, nhead=4, num_layers=2):
        super().__init__()
        self.proj = nn.Conv1d(1, d_model, kernel_size=3, padding=1)
        encoder_layer = nn.TransformerEncoderLayer(d_model=d_model, nhead=nhead, dim_feedforward=128, dropout=0.1, batch_first=True)
        self.encoder = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
        self.pool = nn.AdaptiveAvgPool1d(1)
        self.fc = nn.Linear(d_model, 64)
    def forward(self, x):
        # x: (B,1,L)
        x = self.proj(x)           # (B, d_model, L)
        x = x.permute(0,2,1)       # (B, L, d_model)
        x = self.encoder(x)        # (B, L, d_model)
        x = x.permute(0,2,1)       # (B, d_model, L)
        x = self.pool(x).squeeze(-1)  # (B, d_model)
        return F.relu(self.fc(x))  # (B,64)

class TabularMLP(nn.Module):
    def __init__(self, n_features):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(n_features, 64),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(64, 32),
            nn.ReLU()
        )
    def forward(self, x):
        return self.net(x)

class FullModel(nn.Module):
    def __init__(self, seq_len, n_tab_features=0, catalog_only=False):
        super().__init__()
        self.catalog_only = catalog_only

        if catalog_only:
            # Catalog-only model (MLP)
            self.catalog_net = nn.Sequential(
                nn.Linear(n_tab_features, 128),
                nn.ReLU(),
                nn.Dropout(0.2),
                nn.Linear(128, 64),
                nn.ReLU(),
                nn.Dropout(0.1),
                nn.Linear(64, 32),
                nn.ReLU()
            )
            final_in = 32
        else:
            # Original CNN + Transformer model
            self.cnn = TimeCNN(seq_len)
            self.trans = SimpleTransformer(seq_len)
            self.use_tab = n_tab_features>0
            if self.use_tab:
                self.tab = TabularMLP(n_tab_features)
                final_in = 128+64+32
            else:
                final_in = 128+64

        self.classifier = nn.Sequential(
            nn.Linear(final_in, 128),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(128, 2)  # binary
        )

    def forward(self, x, tab=None):
        if self.catalog_only:
            # Catalog features only
            features = self.catalog_net(x)  # x is catalog features here
            logits = self.classifier(features)
        else:
            # Original CNN + Transformer
            # x: (B,1,L)
            v1 = self.cnn(x)     # (B,128)
            v2 = self.trans(x)   # (B,64)
            if self.use_tab and tab is not None:
                vt = self.tab(tab)
                cat = torch.cat([v1,v2,vt], dim=1)
            else:
                cat = torch.cat([v1,v2], dim=1)
            logits = self.classifier(cat)
        return logits