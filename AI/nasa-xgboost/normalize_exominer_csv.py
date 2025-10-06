import argparse
from pathlib import Path
import pandas as pd


PREFERRED_COLS = {
    'id_candidates': ['uid', 'target_id', 'tic_id', 'TIC', 'tic', 'ticid', 'TICID'],
    'score_candidates': ['exominer_score', 'score', 'probability', 'exo_score', 'final_prob'],
    # Optional TCE-like columns to help XGBoost feature mapping later
    'tce_period': ['tce_period', 'period', 'orbital_period'],
    'tce_duration': ['tce_duration', 'duration_hr', 'transit_duration_hr'],
    'tce_depth': ['tce_depth', 'depth_ppm', 'transit_depth_ppm'],
    'tce_prad': ['tce_prad', 'planet_radius_earth'],
    'tce_steff': ['tce_steff', 'stellar_temp_k', 'teff_k'],
    'tce_sradius': ['tce_sradius', 'stellar_radius_solar'],
    'tce_smass': ['tce_smass', 'stellar_mass_solar'],
    'tce_impact': ['tce_impact', 'impact_parameter'],
    'tce_eqt': ['tce_eqt', 'equilibrium_temp'],
    'tce_model_snr': ['tce_model_snr', 'snr', 'signal_to_noise']
}


def pick_col(df: pd.DataFrame, candidates: list[str]):
    for c in candidates:
        if c in df.columns:
            return c
    return None


def normalize(input_path: Path, output_path: Path):
    df = pd.read_csv(input_path)

    id_col = pick_col(df, PREFERRED_COLS['id_candidates'])
    score_col = pick_col(df, PREFERRED_COLS['score_candidates'])
    if not score_col:
        raise ValueError('Could not find an ExoMiner score column in the input CSV')

    out = pd.DataFrame()
    if id_col:
        out[id_col] = df[id_col]
        # Also derive a generic id column for convenience
        out['uid'] = df[id_col]
    out['exominer_score'] = df[score_col]

    # Optionally map TCE-like columns
    for std_col, cands in PREFERRED_COLS.items():
        if std_col in ['id_candidates', 'score_candidates']:
            continue
        src = pick_col(df, cands)
        if src:
            out[std_col] = df[src]

    output_path.parent.mkdir(parents=True, exist_ok=True)
    out.to_csv(output_path, index=False)
    return out


def main():
    ap = argparse.ArgumentParser(description='Normalize ExoMiner CSV for ExoLens API service')
    ap.add_argument('--input', required=True, help='Path to the provided ExoMiner CSV')
    ap.add_argument('--output', default=str(Path(__file__).parent / 'exominer_predictions.csv'), help='Output normalized CSV path')
    args = ap.parse_args()
    normalize(Path(args.input), Path(args.output))
    print(f'Done. Wrote normalized CSV to: {args.output}')


if __name__ == '__main__':
    main()
