from __future__ import annotations

import os
from pathlib import Path
from typing import Optional

import joblib
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
XGB_DIR = ROOT / 'nasa-xgboost'
XGB_MODEL_PATH = XGB_DIR / 'xgboost_model.pkl'
STACK_MODEL_PATH = ROOT / 'models' / 'final_model' / 'final_classifier.pkl'
REFERENCE_PATH = ROOT / 'api_service' / 'data' / 'exominer_predictions_reference.csv'


FEATURES_XGBOOST = [
    'orbital_period', 'transit_duration_hr', 'transit_depth_ppm',
    'planet_radius_earth', 'stellar_temp_k', 'stellar_radius_solar',
    'stellar_mass_solar', 'impact_parameter', 'equilibrium_temp',
    'stellar_density', 'duration_over_period', 'depth_per_planet_radius',
    'signal_to_noise'
]


def _feature_engineering(df: pd.DataFrame) -> pd.DataFrame:
    import numpy as np
    d = df.copy()
    d['stellar_density'] = d.get('stellar_mass_solar', 0) / ((d.get('stellar_radius_solar', 1) ** 3) + 1e-6)
    d['duration_over_period'] = d.get('transit_duration_hr', 0) / ((d.get('orbital_period', 1) * 24) + 1e-6)
    d['depth_per_planet_radius'] = d.get('transit_depth_ppm', 0) / ((d.get('planet_radius_earth', 1) ** 2) + 1e-6)
    d.replace([np.inf, -np.inf], 0, inplace=True)
    return d


def _ensure_columns(df: pd.DataFrame, cols: list[str]) -> pd.DataFrame:
    d = df.copy()
    for c in cols:
        if c not in d.columns:
            d[c] = 0
    return d


def _save_csv_safe(path: Path, df: pd.DataFrame) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(path, index=False)


def _detect_id_column(df: pd.DataFrame) -> Optional[str]:
    for c in ['uid', 'target_id', 'tic_id', 'TIC', 'tic', 'ticid', 'TICID']:
        if c in df.columns:
            return c
    return None


def _detect_score_column(df: pd.DataFrame) -> Optional[str]:
    for c in ['exominer_score', 'score', 'probability', 'final_prob', 'exo_score']:
        if c in df.columns:
            return c
    return None


def _load_exominer_reference() -> Optional[pd.DataFrame]:
    envp = os.getenv('EXOMINER_CSV_PATH')
    paths = [Path(envp)] if envp else []
    paths.append(REFERENCE_PATH)
    for p in paths:
        if p and p.exists():
            try:
                return pd.read_csv(p)
            except Exception:
                continue
    return None


def _load_user_dataframe(csv_content: str, base_dir: Path) -> pd.DataFrame:
    input_dir = base_dir / 'input'
    input_dir.mkdir(parents=True, exist_ok=True)
    input_csv = input_dir / 'input.csv'
    with open(input_csv, 'w', encoding='utf-8') as f:
        f.write(csv_content)
    return pd.read_csv(input_csv)


def _augment_with_exominer(user_df: pd.DataFrame) -> pd.DataFrame:
    exo_score_col = _detect_score_column(user_df)
    if exo_score_col is None:
        exo_ref = _load_exominer_reference()
        if exo_ref is None:
            raise RuntimeError('No ExoMiner score found in input and no reference CSV available')
        uid_col_user = _detect_id_column(user_df)
        uid_col_ref = _detect_id_column(exo_ref)
        score_col_ref = _detect_score_column(exo_ref)
        if uid_col_user is None or uid_col_ref is None or score_col_ref is None:
            raise RuntimeError('Unable to detect ID/score columns in reference or input CSV')
        out = user_df.merge(
            exo_ref[[uid_col_ref, score_col_ref]].rename(columns={uid_col_ref: 'join_id', score_col_ref: 'exominer_score'}),
            left_on=uid_col_user, right_on='join_id', how='left'
        )
        out.drop(columns=['join_id'], inplace=True)
        return out
    else:
        if exo_score_col != 'exominer_score':
            return user_df.rename(columns={exo_score_col: 'exominer_score'})
        return user_df


def _build_features(user_df: pd.DataFrame) -> pd.DataFrame:
    if all(c in user_df.columns for c in FEATURES_XGBOOST):
        feat_df = user_df[FEATURES_XGBOOST].copy()
    else:
        feature_map = {
            'orbital_period': 'tce_period',
            'transit_duration_hr': 'tce_duration',
            'transit_depth_ppm': 'tce_depth',
            'planet_radius_earth': 'tce_prad',
            'stellar_temp_k': 'tce_steff',
            'stellar_radius_solar': 'tce_sradius',
            'stellar_mass_solar': 'tce_smass',
            'impact_parameter': 'tce_impact',
            'equilibrium_temp': 'tce_eqt',
            'signal_to_noise': 'tce_model_snr',
        }
        tmp = pd.DataFrame()
        for k, v in feature_map.items():
            if v in user_df.columns:
                tmp[k] = user_df[v]
        # If no mapped columns present, create a zero-filled frame with matching index
        if tmp.shape[0] == 0:
            feat_df = pd.DataFrame({c: 0 for c in FEATURES_XGBOOST}, index=user_df.index)
        else:
            feat_df = _ensure_columns(tmp.reindex(user_df.index), FEATURES_XGBOOST)
    feat_df = _feature_engineering(feat_df)
    return feat_df[FEATURES_XGBOOST].fillna(0)


_XGB_MODEL = None
_STACK_MODEL = None
_EXO_REF = None


def _lazy_load_artifacts():
    global _XGB_MODEL, _STACK_MODEL, _EXO_REF
    if _XGB_MODEL is None:
        _XGB_MODEL = joblib.load(XGB_MODEL_PATH)
    if _STACK_MODEL is None:
        path = STACK_MODEL_PATH
        if not path.exists():
            # Fallback to legacy location/name
            legacy = XGB_DIR / 'meta_model.pkl'
            if legacy.exists():
                path = legacy
        _STACK_MODEL = joblib.load(path)
    if _EXO_REF is None:
        ref = _load_exominer_reference()
        if ref is None:
            raise RuntimeError('Reference ExoMiner CSV not found. Use normalize_exominer_data.py to generate it or set EXOMINER_CSV_PATH.')
        # Ensure standard columns
        if 'target_id' not in ref.columns or 'exominer_score' not in ref.columns:
            # Attempt to rename common variants
            ref = ref.rename(columns={'tic_id': 'target_id', 'score': 'exominer_score'})
        _EXO_REF = ref


def _augment_with_reference(user_df: pd.DataFrame) -> pd.DataFrame:
    # If user_df already has exominer_score, keep it; otherwise join from _EXO_REF
    if 'exominer_score' in user_df.columns:
        return user_df
    join_key = 'target_id' if 'target_id' in user_df.columns else _detect_id_column(user_df)
    if join_key is None:
        raise ValueError('No target identifier found in input CSV (expected target_id or a known ID column).')
    return user_df.merge(_EXO_REF[['target_id', 'exominer_score']], left_on=join_key, right_on='target_id', how='left')


def get_final_predictions(csv_content: str) -> pd.DataFrame:
    _lazy_load_artifacts()
    # Parse input
    from io import StringIO
    user_df = pd.read_csv(StringIO(csv_content))

    # Enrich with ExoMiner score
    user_df = _augment_with_reference(user_df)

    # Build features for XGBoost
    feat_df = _build_features(user_df)

    # Predict XGBoost
    xgb_scores = _XGB_MODEL.predict_proba(feat_df)[:, 1]

    # Stacking using exominer_score + xgboost_score
    import numpy as np
    stacking_input = np.column_stack((xgb_scores, user_df['exominer_score'].fillna(0).values))
    final_probs = _STACK_MODEL.predict_proba(stacking_input)[:, 1]

    out_df = user_df.copy()
    out_df['xgboost_score'] = xgb_scores
    out_df['final_probability'] = final_probs
    return out_df
