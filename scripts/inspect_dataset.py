from pathlib import Path

import pandas as pd


RAW_DIR = Path("data/raw")

FORMS_FILE = RAW_DIR / "Construction_Data_PM_Forms_All_Projects.csv"
TASKS_FILE = RAW_DIR / "Construction_Data_PM_Tasks_All_Projects.csv"


def inspect_csv(name: str, path: Path) -> None:
    if not path.exists():
        raise FileNotFoundError(f"Could not find: {path.resolve()}")

    dataframe = pd.read_csv(path, low_memory=False)

    print(f"\n{'=' * 70}")
    print(name)
    print(f"{'=' * 70}")
    print(f"Rows: {len(dataframe):,}")
    print(f"Columns: {len(dataframe.columns)}")

    print("\nColumn names:")
    for column in dataframe.columns:
        print(f"- {column}")

    print("\nFirst three records:")
    print(dataframe.head(3).to_string())

    print("\nMissing values by column:")
    missing = dataframe.isna().sum().sort_values(ascending=False)
    print(missing.head(20).to_string())


def main() -> None:
    inspect_csv("FORMS DATASET", FORMS_FILE)
    inspect_csv("TASKS DATASET", TASKS_FILE)


if __name__ == "__main__":
    main()