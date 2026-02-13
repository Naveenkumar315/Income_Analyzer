# app/services/document_aggregator.py

import re
from typing import Dict, Any


def extract_borrower_name(item: Dict[str, Any]) -> str:
    """
    Try best-effort borrower name extraction from document labels.
    Fallback to UNKNOWN_BORROWER.
    """
    labels = item.get("Labels", [])

    for label in labels:
        name = label.get("Label", "").lower()
        if "employee name" in name or "borrower" in name or "name" == name:
            value = label.get("Value")
            if value:
                return value.strip()

    return "UNKNOWN_BORROWER"


def normalize_doc_type(skill_name: str) -> str:
    skill_name = skill_name.lower()

    if "w2" in skill_name:
        return "W-2"
    if "paystub" in skill_name:
        return "Paystub"
    if "bank" in skill_name:
        return "Bank Statement"

    return skill_name.title()


def aggregate_document_json(raw_json: Dict[str, Any]) -> Dict[str, Any]:
    """
    Converts document-level Form Recognizer JSON into
    borrower -> document_type -> [documents]
    """
    aggregated: Dict[str, Dict[str, list]] = {}

    summary = raw_json.get("Summary", [])
    if not isinstance(summary, list):
        return aggregated

    for item in summary:
        borrower = extract_borrower_name(item)
        doc_type = normalize_doc_type(item.get("SkillName", "Unknown"))

        aggregated.setdefault(borrower, {})
        aggregated[borrower].setdefault(doc_type, [])
        aggregated[borrower][doc_type].append(item)

    return aggregated
