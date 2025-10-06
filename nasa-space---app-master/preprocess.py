# preprocess.py
import numpy as np
import pandas as pd
from scipy.signal import savgol_filter
from scipy import interpolate
import os
from tqdm import tqdm

# ---------------- parameters ----------------
OUT_LEN = 201               # length of phase-folded vector (odd center point)
WINDOW = 101                # smoothing window for detrend (must be odd)
POLYORDER = 3
PHASE_PAD = 0.1             # fraction of period to include on each side of transit center
BIN_METHOD = 'median'       # or 'mean'
# --------------------------------------------

def detrend(time, flux, window=WINDOW, polyorder=POLYORDER):
    # smooth trend using Savitzky-Golay and divide flux by trend
    if len(flux) < window:
        return flux - np.median(flux)
    try:
        trend = savgol_filter(flux, window_length=window, polyorder=polyorder)
    except Exception:
        trend = savgol_filter(flux, window_length=window if window%2 else window+1, polyorder=polyorder)
    return flux / trend - 1.0  # normalized residual (approx relative flux)

def phase_fold(time, flux, period, t0, width_frac=PHASE_PAD, out_len=OUT_LEN):
    # compute phase around transit center (phase in [-width_frac, +width_frac])
    phase = ((time - t0 + 0.5*period) % period) / period - 0.5
    mask = np.abs(phase) <= width_frac
    if mask.sum() < 10:
        # fallback to use all data
        mask = np.ones_like(phase, dtype=bool)
    ptime = phase[mask]  # in units of period
    pflux = flux[mask]
    # rescale phase to [-1,1]
    xp = np.linspace(-width_frac, width_frac, out_len)
    try:
        f = interpolate.interp1d(ptime, pflux, kind='linear', bounds_error=False, fill_value=np.nan)
        y = f(xp)
    except Exception:
        # fallback: uniform binning
        y = np.interp(xp, np.linspace(ptime.min(), ptime.max(), len(ptime)), pflux)
    # if NaNs, fill with local median
    if np.any(np.isnan(y)):
        med = np.nanmedian(y)
        y = np.nan_to_num(y, nan=med)
    # normalize by std
    std = y.std() if y.std() > 0 else 1.0
    y = (y - y.mean()) / std
    return y

def process_row(row, lc_folder=None):
    # row must have keys: 'time', 'flux' arrays OR path to file plus period,t0,label
    # here we assume per-row arrays are loaded already or separate file path columns
    # adapt based on your dataset storage.
    time = np.array(row['time'])
    flux = np.array(row['flux'])
    period = float(row['period'])
    t0 = float(row['t0'])
    flux = detrend(time, flux)
    pf = phase_fold(time, flux, period, t0)
    return pf

def main(master_table_csv, out_npz='dataset.npz', lc_folder=None, use_catalog_features=False):
    df = pd.read_csv(master_table_csv, comment='#')  # Skip comment lines for NASA files

    # Handle NASA Exoplanet Archive format
    if 'kepid' in df.columns:
        print("Detected NASA Exoplanet Archive format")
        # Map NASA columns to expected format
        df['id'] = df['kepid'].astype(str)
        df['period'] = df['koi_period']
        df['t0'] = df['koi_time0bk']
        # Use disposition as label (CONFIRMED = 1, FALSE POSITIVE = 0)
        df['label'] = df['koi_disposition'].map({'CONFIRMED': 1, 'FALSE POSITIVE': 0, 'CANDIDATE': 1})
        use_catalog_features = True

    X = []
    y = []
    meta = []

    for _, row in tqdm(df.iterrows(), total=len(df)):
        if use_catalog_features:
            # Use catalog features instead of light curves
            features = extract_catalog_features(row)
            X.append(features.astype(np.float32))
        else:
            # Original light curve processing
            # user must adapt to their dataset columns:
            # If per-row light-curve is saved as file path in column 'lc_path', load it:
            if lc_folder and 'lc_path' in row and not pd.isna(row['lc_path']):
                lc = pd.read_csv(os.path.join(lc_folder, row['lc_path']))  # expects time,flux columns
                row_time = lc['time'].values
                row_flux = lc['flux'].values
                r = {'time':row_time, 'flux':row_flux, 'period':row['period'], 't0':row['t0']}
                pf = process_row(r)
            else:
                # if arrays stored as strings (like "[1.0,2.0,...]"), eval or np.fromstring
                # example expects 'time' and 'flux' columns with comma-separated floats
                time = np.fromstring(row['time'].strip("[]"), sep=',')
                flux = np.fromstring(row['flux'].strip("[]"), sep=',')
                r = {'time':time, 'flux':flux, 'period':row['period'], 't0':row['t0']}
                pf = process_row(r)
            X.append(pf.astype(np.float32))

        y.append(int(row['label']))
        meta.append({'id': row.get('id', None), 'period': row['period']})

    X = np.stack(X)  # (N, feature_dim) or (N, OUT_LEN)
    y = np.array(y, dtype=np.int64)
    np.savez_compressed(out_npz, X=X, y=y, meta=meta)
    print("Saved:", out_npz, "X shape:", X.shape, "y shape:", y.shape)

def extract_catalog_features(row):
    """Extract relevant features from NASA catalog for ML model"""
    features = []

    # Basic orbital parameters
    features.append(row['koi_period'])  # Period
    features.append(row['koi_time0bk'])  # Transit time
    features.append(row.get('koi_impact', 0))  # Impact parameter
    features.append(row.get('koi_duration', 0))  # Transit duration
    features.append(row.get('koi_depth', 0))  # Transit depth
    features.append(row.get('koi_prad', 1))  # Planet radius (Earth radii)
    features.append(row.get('koi_teq', 300))  # Equilibrium temperature
    features.append(row.get('koi_insol', 1))  # Insolation flux
    features.append(row.get('koi_slogg', 4.5))  # Stellar surface gravity
    features.append(row.get('koi_srad', 1))  # Stellar radius
    features.append(row.get('koi_steff', 5500))  # Stellar effective temperature
    features.append(row.get('koi_smass', 1))  # Stellar mass
    features.append(row.get('koi_sage', 4.5))  # Stellar age

    # Fill NaN values with defaults
    features = [f if not pd.isna(f) else 0 for f in features]

    return np.array(features, dtype=np.float32)

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--master', type=str, required=True, help='CSV with rows and light-curve links/arrays')
    parser.add_argument('--out', type=str, default='dataset.npz')
    parser.add_argument('--lc_folder', type=str, default=None)
    parser.add_argument('--catalog-only', action='store_true', help='Use catalog features only (NASA format)')
    args = parser.parse_args()
    main(args.master, args.out, args.lc_folder, args.catalog_only)