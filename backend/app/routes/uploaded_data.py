from typing import List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException

from app.models.uploaded_data import EmailRequest, UploadedDataOut
from app.services.uploaded_data import get_uploaded_data_by_email
from app.services.document_aggregator import aggregate_document_json
from app.utils.borrower_cleanup_service import cleanup_borrowers_adapter
from app.utils.Data_formatter import normalize_money_fields
from app.db import get_db


router = APIRouter(prefix="/uploaded-data", tags=["Uploaded Data"])


# ---------------------------------------------------------
# EXISTING API — UNCHANGED
# ---------------------------------------------------------
@router.post("/by-email", response_model=List[UploadedDataOut])
async def fetch_uploaded_data(request: EmailRequest, db=Depends(get_db)):
    results = await get_uploaded_data_by_email(db, request.email)
    if not results:
        raise HTTPException(
            status_code=404,
            detail="No records found for this email"
        )
    return results


# ---------------------------------------------------------
# NEW API — CLEAN & SAVE JSON
# ---------------------------------------------------------
@router.post("/clean-json")
async def clean_json(payload: dict, db=Depends(get_db)):
    """
    Accepts:
    - Loan-level aggregated JSON
    - Document-level Form Recognizer JSON (Summary-based)

    Produces:
    - borrower -> document_type -> list[documents]
    """

    raw_json = payload.get("raw_json")
    email = payload.get("email")
    loanID = payload.get("loanID")
    username = payload.get("username")

    if not raw_json:
        raise HTTPException(
            status_code=400,
            detail="Empty JSON input"
        )

    if not email or not loanID:
        raise HTTPException(
            status_code=400,
            detail="email and loanID are required"
        )

    # -------------------------------------------------
    # STEP 1: Detect & aggregate document-level JSON
    # -------------------------------------------------
    if isinstance(raw_json, dict) and "Summary" in raw_json:
        raw_json = aggregate_document_json(raw_json)

    if not isinstance(raw_json, dict) or not raw_json:
        raise HTTPException(
            status_code=400,
            detail="Invalid or unsupported JSON structure"
        )

    # -------------------------------------------------
    # STEP 2: Borrower cleanup
    # (uses your existing 500+ line logic safely)
    # -------------------------------------------------
    cleaned = cleanup_borrowers_adapter(raw_json)

    if not cleaned:
        raise HTTPException(
            status_code=400,
            detail="No borrower data found after cleanup"
        )

    # -------------------------------------------------
    # STEP 3: Normalize numeric fields
    # -------------------------------------------------
    normalize_money_fields(cleaned)

    # -------------------------------------------------
    # STEP 4: Persist to DB
    # -------------------------------------------------
    record = {
        "email": email,
        "loanID": loanID,
        "username": username,
        "original_data": raw_json,
        "cleaned_data": cleaned,
        "hasModifications": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    await db["uploadedData"].insert_one(record)

    return {
        "message": "Upload saved successfully",
        "cleaned_json": cleaned
    }
