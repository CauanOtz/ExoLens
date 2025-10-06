# dataset.py
import numpy as np
import torch
from torch.utils.data import Dataset
import random

def add_noise(x, scale=0.003):
    return x + np.random.normal(0, scale, size=x.shape)

def random_shift_phase(x, max_shift=5):
    # circular shift by up to max_shift indices
    s = np.random.randint(-max_shift, max_shift+1)
    return np.roll(x, s)

class LC_Dataset(Dataset):
    def __init__(self, npzfile, indices=None, augment=False):
        data = np.load(npzfile, allow_pickle=True)
        self.X = data['X']  # (N, L)
        self.y = data['y']
        self.augment = augment
        if indices is not None:
            self.X = self.X[indices]
            self.y = self.y[indices]
    def __len__(self):
        return len(self.X)
    def __getitem__(self, idx):
        x = self.X[idx].astype(np.float32)
        if self.augment:
            if random.random() < 0.5:
                x = add_noise(x, scale=0.002 + random.random()*0.004)
            if random.random() < 0.5:
                x = random_shift_phase(x, max_shift=6)
            if random.random() < 0.15:
                # random masking
                i = np.random.randint(0, len(x)-10)
                x[i:i+np.random.randint(3,10)] = 0
        x = np.expand_dims(x, 0)  # channel dim -> (1, L)
        return torch.tensor(x, dtype=torch.float32), torch.tensor(self.y[idx], dtype=torch.long)