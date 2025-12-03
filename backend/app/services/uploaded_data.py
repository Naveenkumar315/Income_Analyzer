from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class UploadedDataOut(BaseModel):
    loanID: str
    file_name: str
    updated_at: Optional[datetime]
    borrower: List[str]   # ✅ Always a list now
    analyzed_data : bool


async def get_uploaded_data_by_email(db, email: str):
    cursor = db["uploadedData"].find({"email": email})
    results = []

    async for record in cursor:
        borrowers = []
        if record.get("cleaned_data") and isinstance(record["cleaned_data"], dict):
            borrowers = list(record["cleaned_data"].keys())

        updated_at = record.get("updated_at")
        if isinstance(updated_at, str):
            try:
                updated_at = datetime.strptime(updated_at, "%Y-%m-%d %I:%M:%S %p")
            except Exception:
                updated_at = None

        # ✅ New flag
        analyzed_flag = "analyzed_data" in record

        results.append(
            UploadedDataOut(
                loanID=record.get("loanID"),
                file_name=record.get("file_name"),
                updated_at=updated_at,
                borrower=borrowers,
                analyzed_data=analyzed_flag,
            )
        )

    return results

