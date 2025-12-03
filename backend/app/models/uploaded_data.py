from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class EmailRequest(BaseModel):
    email: EmailStr


class UploadedDataOut(BaseModel):
    loanID: Optional[str]
    file_name: Optional[str]
    updated_at: Optional[datetime]
    borrower:  List[str]
    analyzed_data: bool
