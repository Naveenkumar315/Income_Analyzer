from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=3)


class UserDB(UserBase):
    id: str
    created_at: datetime
    updated_at: datetime


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    status: Optional[str] = None  # "pending", "active", "inactive"
    user_id: Optional[str] = None
    role: Optional[str] = None  # "User", "Admin"
    is_first_time_user: bool


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class SendCodeRequest(BaseModel):
    email: EmailStr


class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str


class CheckEmailRequest(BaseModel):
    email: EmailStr


# Signup Models
class CompanyInfo(BaseModel):
    companyName: str
    companySize: str
    companyPhone: str
    companyEmail: EmailStr


class CompanyAddress(BaseModel):
    streetAddress: str
    zipCode: str
    city: str
    state: str


class PrimaryContact(BaseModel):
    firstName: str
    lastName: str
    phone: str
    email: EmailStr


class IndividualInfo(BaseModel):
    firstName: str
    lastName: str
    phone: str
    email: EmailStr


class SignupRequest(BaseModel):
    email: EmailStr
    type: str  # "company" or "individual"
    companyInfo: Optional[CompanyInfo] = None
    companyAddress: Optional[CompanyAddress] = None
    primaryContact: Optional[PrimaryContact] = None
    individualInfo: Optional[IndividualInfo] = None
    # Optional, will be auto-generated from first/last name
    username: Optional[str] = None


class UpdatePasswordRequest(BaseModel):
    email: EmailStr
    password: str
    verificationCode: str
    verifycode: bool


class CreateCompanyUserRequest(BaseModel):
    company_admin_id: str
    email: EmailStr
    firstName: str
    lastName: str
    role: str  # Admin / User
    phone: str | None = None


class UpdateRoleRequest(BaseModel):
    role: str


class GetUserRequest(BaseModel):
    email: str
