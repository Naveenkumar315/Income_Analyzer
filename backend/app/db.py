from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
from pymongo import ASCENDING


client = AsyncIOMotorClient(settings.db_url)
db = client[settings.db_name]

# Create index on username + loanID for fast lookups
async def init_db():
    await db["uploadedData"].create_index([("username", ASCENDING), ("loanID", ASCENDING)], unique=True)

    
def get_db():
    return db   # just return, don’t wrap in Depends here