# routes/auth_update_password.py
from datetime import datetime
from typing import Any
from fastapi import HTTPException, status
from app.models.user import UpdatePasswordRequest, VerifyCodeRequest
from app.db import get_collection
from app.services.send_code import verify_otp_code
from app.utils.security import hash_password


def validate_password_rules(pwd: str) -> None:
    """
    Server-side validation for the same rules used on frontend.
    Raises HTTPException(status 422) on failure.
    """
    if not pwd or len(pwd) < 12:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                            detail="Password must be at least 12 characters long.")
    import re
    if not re.search(r"[a-z]", pwd):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                            detail="Password must include at least one lowercase letter.")
    if not re.search(r"[A-Z]", pwd):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                            detail="Password must include at least one uppercase letter.")
    if not re.search(r"[0-9]", pwd):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                            detail="Password must include at least one number.")
    if not re.search(r'[!@#$%^&*(),.?":{}|]', pwd):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                            detail='Password must include at least one special character from [!@#$%^&*(),.?":{}|].')


async def update_password(payload: UpdatePasswordRequest) -> Any:
    email = payload.email.lower().strip()
    password = (payload.password or "").strip()
    code = payload.verificationCode or ""
    verifycode = payload.verifycode or ""

    print("Hey This is calling")
    # 1) validate password rules (fail fast)

    # 3) hash the new password
    validate_password_rules(password)

    hashed = hash_password(password)
    update_data = {
        "password": hashed,
        "passwordUpdatedAt": datetime.utcnow(),
    }

    # 2) verify OTP (should raise HTTPException on invalid/expired/used/attempts)
    if (verifycode):
        await verify_otp_code(VerifyCodeRequest(email=email, code=code))
    else:
        if not verifycode:
            update_data["is_first_time_user"] = False

    # 4) update user document
    users_coll = get_collection("users")
    result = await users_coll.update_one(
        {"email": email},
        {
            "$set": update_data
        },
    )

    if result.matched_count == 0:
        # optional: to avoid user enumeration you can still return 200 here.
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="No user found with that email.")

    return {"success": True, "message": "Password updated. Please login with your new password."}
