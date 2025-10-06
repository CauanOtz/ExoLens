from __future__ import annotations

import argparse
from pathlib import Path
import pandas as pd


def normalize_exominer_csv(input_path: Path, output_path: Path) -> pd.DataFrame:
    df = pd.read_csv(input_path)

    # Detect id column (prefer 'target_id', then 'tic_id', 'TIC', 'tic')
    id_col = None
    for c in ['target_id', 'tic_id', 'TIC', 'tic', 'TIC ID']:
        if c in df.columns:
            id_col = c
            break
    if id_col is None:
        raise ValueError("Could not find an identifier column (expected one of: target_id, tic_id, TIC, tic)")

    # Detect score column (prefer 'score', then 'exominer_score', 'probability')
    score_col = None
    for c in ['score', 'exominer_score', 'probability', 'ExoMiner Score']:
        if c in df.columns:
            score_col = c
            break
    if score_col is None:
        raise ValueError("Could not find an ExoMiner score column (expected one of: score, exominer_score, probability)")

    out = pd.DataFrame()
    out['target_id'] = df[id_col]
    out['exominer_score'] = df[score_col]

    output_path.parent.mkdir(parents=True, exist_ok=True)
    out.to_csv(output_path, index=False)
    return out


def main():
    parser = argparse.ArgumentParser(description='Normalize ExoMiner CSV into a compact reference used by the API')
    parser.add_argument('--input', default=r'C:\Users\Enrico\Downloads\exominer_vetting_tess-spoc-2-min-s1s67_dashtable_dvm-url_scoregt0.1.csv', help='Path to the raw ExoMiner CSV')
    parser.add_argument('--output', default=str(Path(__file__).resolve().parents[1] / 'api_service' / 'data' / 'exominer_predictions_reference.csv'), help='Output CSV path')
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)
    normalize_exominer_csv(input_path, output_path)
    print(f'Wrote normalized reference to: {output_path}')


if __name__ == '__main__':
    main()
