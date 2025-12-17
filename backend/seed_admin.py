from app.utils.security import hash_password
from app.db import db
from datetime import datetime
import asyncio
import sys
import os
sys.path.append(os.getcwd())
print("Importing app modules...", flush=True)


async def seed_admin():
    print("Seeding admin user...")

    email = "lsaravanan@loandna.com".lower().strip()
    password = "Test@123"
    firstName = "Naveen"
    lastName = "M"
    username = f"{firstName} {lastName}"
    # Check if user exists
    existing_user = await db["users"].find_one({"email": email})
    if existing_user:
        print(f"User with email {email} already exists.")
        return

    hashed_password = hash_password(password)
    now = datetime.utcnow()

    admin_user = {
        "email": email,
        "password": hashed_password,
        "role": "admin",
        "type": "individual",
        "status": "active",  # Admins should probably be active by default? Or pending? User didn't specify, but usually seed scripts create active users. Let's stick to what's implied or standard. The prompt didn't say active, but "seed admin" usually implies ready to use.
        "is_first_time_user": False,
        "username": username,  # Full name as username
        "individualInfo": {
            "firstName": firstName,
            "lastName": lastName,
            "phone": "123456789",
            "email": email
        },
        "created_at": now,
        "updated_at": now
    }

    result = await db["users"].insert_one(admin_user)
    print(f"Admin user seeded successfully with ID: {result.inserted_id}")

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(seed_admin())
