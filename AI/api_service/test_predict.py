import pandas as pd
from io import StringIO
from AI.api_service.services import get_final_predictions, REFERENCE_PATH


def main():
    ref = pd.read_csv(REFERENCE_PATH)
    sample = ref.head(15)[['target_id']]
    csv_content = 'target_id\n' + '\n'.join(sample['target_id'].astype(str).tolist())
    df = get_final_predictions(csv_content)
    # Print the first 15 rows (should be 15 exactly)
    print(df.head(15).to_csv(index=False))


if __name__ == '__main__':
    main()
