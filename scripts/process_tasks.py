from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pandas as pd


RAW_FILE = Path(
    "data/raw/Construction_Data_PM_Tasks_All_Projects.csv"
)

OUTPUT_FILE = Path(
    "data/processed/tasks.json"
)


def clean_string(value: Any) -> str:
    """Convert missing values to empty strings and clean normal values."""
    if pd.isna(value):
        return ""

    return str(value).strip()


def clean_boolean(value: Any) -> bool:
    """Safely convert CSV boolean-like values to Python booleans."""
    if pd.isna(value):
        return False

    if isinstance(value, bool):
        return value

    normalized = str(value).strip().lower()

    return normalized in {
        "true",
        "1",
        "yes",
        "y",
    }


def create_analysis_placeholder() -> dict[str, Any]:
    """Return an empty structure for future AI analysis."""
    return {
        "status": "not_analyzed",
        "classification": None,
        "confidence": None,
        "issueType": None,
        "priority": None,
        "rfiRecommended": None,
        "changeOrderRisk": None,
        "costRisk": None,
        "scheduleRisk": None,
        "reasoning": None,
        "suggestedRfiQuestion": None,
        "costDrivers": [],
        "missingInformation": [],
        "requiredDocumentation": [],
        "recommendedActions": [],
        "analyzedAt": None,
        "analysisMethod": None,
    }


def process_tasks() -> list[dict[str, Any]]:
    if not RAW_FILE.exists():
        raise FileNotFoundError(
            f"Could not find CSV file: {RAW_FILE.resolve()}"
        )

    dataframe = pd.read_csv(RAW_FILE, low_memory=False)

    tasks: list[dict[str, Any]] = []

    for _, row in dataframe.iterrows():
        task = {
            "id": clean_string(row["Ref"]),
            "status": clean_string(row["Status"]),
            "location": clean_string(row["Location"]),
            "description": clean_string(row["Description"]),
            "created": clean_string(row["Created"]),
            "target": clean_string(row["Target"]),
            "type": clean_string(row["Type"]),
            "package": clean_string(row["To Package"]),
            "statusChanged": clean_string(row["Status Changed"]),
            "association": clean_string(row["Association"]),
            "overDue": clean_boolean(row["OverDue"]),
            "images": clean_boolean(row["Images"]),
            "comments": clean_boolean(row["Comments"]),
            "documents": clean_boolean(row["Documents"]),
            "priority": clean_string(row["Priority"]),
            "cause": clean_string(row["Cause"]),
            "project": clean_string(row["project"]),
            "reportStatus": clean_string(row["Report Status"]),
            "taskGroup": clean_string(row["Task Group"]),
            "analysis": create_analysis_placeholder(),
        }

        tasks.append(task)

    return tasks


def main() -> None:
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    tasks = process_tasks()

    with OUTPUT_FILE.open("w", encoding="utf-8") as file:
        json.dump(
            tasks,
            file,
            indent=2,
            ensure_ascii=False,
        )

    print(f"Imported and enriched {len(tasks):,} tasks.")
    print(f"Saved to: {OUTPUT_FILE.resolve()}")


if __name__ == "__main__":
    main()