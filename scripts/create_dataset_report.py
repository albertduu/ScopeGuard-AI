from pathlib import Path

import pandas as pd


RAW_DIR = Path("data/raw")
OUTPUT_DIR = Path("data/processed")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

FILES = {
    "forms": RAW_DIR / "Construction_Data_PM_Forms_All_Projects.csv",
    "tasks": RAW_DIR / "Construction_Data_PM_Tasks_All_Projects.csv",
}


def summarize_dataset(name: str, path: Path) -> pd.DataFrame:
    dataframe = pd.read_csv(path, low_memory=False)

    rows = []

    for column in dataframe.columns:
        non_null = dataframe[column].dropna()
        examples = non_null.astype(str).drop_duplicates().head(3).tolist()

        rows.append(
            {
                "dataset": name,
                "column": column,
                "data_type": str(dataframe[column].dtype),
                "non_null_count": int(dataframe[column].notna().sum()),
                "missing_count": int(dataframe[column].isna().sum()),
                "unique_count": int(dataframe[column].nunique(dropna=True)),
                "examples": " | ".join(examples),
            }
        )

    return pd.DataFrame(rows)


def main() -> None:
    reports = [
        summarize_dataset(name, path)
        for name, path in FILES.items()
    ]

    report = pd.concat(reports, ignore_index=True)

    output_path = OUTPUT_DIR / "dataset_column_report.csv"
    report.to_csv(output_path, index=False)

    print(f"Saved report to: {output_path.resolve()}")


if __name__ == "__main__":
    main()