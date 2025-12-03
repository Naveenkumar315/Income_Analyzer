from datetime import datetime
from app.db import db

async def log_action(
    loanID: str,
    email: str,
    username: str,
    action: str,
    # description: str,
    old_cleaned_data: dict,
    new_cleaned_data: dict,
):
    log_entry = {
        "loanID": loanID,
        "email": email,
        "username": username,
        "action": action,
        # "description": description,
        "old_cleaned_data": old_cleaned_data,
        "new_cleaned_data": new_cleaned_data,
        "timestamp": datetime.utcnow().isoformat()
    }
    await db["auditLogs"].insert_one(log_entry)
    return log_entry
