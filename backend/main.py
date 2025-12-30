import urllib.parse
import random
import base64
import zlib
from fastapi import FastAPI, HTTPException, Body, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from datetime import datetime
import asyncio
import json
import yaml
import uvicorn
from bson import ObjectId

from app.routes import auth, uploaded_data, admin
from app.utils.borrower_cleanup_service import clean_borrower_documents_from_dict
from app.db import db
from app.services.audit_service import log_action  # <-- audit service
from app.utils.MCP_Connector import MCPClient
from app.utils.Data_formatter import BorrowerDocumentProcessor
import logging
import os
from fastapi.responses import RedirectResponse
from fastapi.responses import HTMLResponse
import xmltodict
import uuid
from datetime import datetime, timedelta
from app.utils.security import verify_token, create_access_token, create_refresh_token
from dotenv import load_dotenv

SSO_TEMP_STORE = {}
SSO_TOKEN_TTL = 60

# -----------------------------
# Logging Setup
# -----------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# -----------------------------
# Config
# -----------------------------
allowed_sections = ["BorrowerName", "W2", "VOE", "Paystubs", "Paystub"]
bs_allowed_sections = ["BorrowerName", "W2",
                       "VOE", "Paystubs", "Paystub", 'Bank Statement']
bank_statement = ['Bank Statement']


try:
    with open("requirements.yaml") as stream:
        requirements = yaml.safe_load(stream)
except FileNotFoundError:
    logger.error("requirements.yaml file not found")
    requirements = {"rules": [], "required_fields": []}
except yaml.YAMLError as e:
    logger.error(f"Error parsing requirements.yaml: {e}")
    requirements = {"rules": [], "required_fields": []}

app = FastAPI(title="Income Analyzer API", version="1.0.0")

# Routers
app.include_router(auth.router)
app.include_router(uploaded_data.router)
app.include_router(admin.router)

# CORS
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


mcp_client = MCPClient("http://localhost:8000/mcp")
client_lock = asyncio.Lock()


# Storage for uploaded borrower content
uploaded_content: Dict[int, Dict[str, Any]] = {}

# -----------------------------
# Startup / Shutdown
# -----------------------------


def clean_json_data(obj):
    if isinstance(obj, dict):
        # Remove unwanted keys
        obj.pop("Link", None)
        obj.pop("ConfidenceScore", None)
        obj.pop("Url", None)
        obj.pop("LabelOrder", None)
        obj.pop("ScreenshotUrl", None)
        obj.pop("GeneratedOn", None)
        obj.pop("DocTitle", None)
        obj.pop("PageNumber", None)
        obj.pop("StageName", None)
        obj.pop("Title", None)
        obj.pop("SkillName", None)
        # Recursively clean nested dicts
        for key in list(obj.keys()):
            clean_json_data(obj[key])
    elif isinstance(obj, list):
        for item in obj:
            clean_json_data(item)
    return obj


def filter_documents_by_type(processed_data, document_types):
    """
    Filter processed borrower data to include only specified document types.

    Args:
        processed_data (dict): The processed JSON data with borrower names as keys
        document_types (list): List of document types to keep (e.g., ['Paystubs', 'W2'])

    Returns:
        dict: Filtered data containing only the specified document types for each borrower
    """
    filtered_data = {}

    # Iterate through each borrower
    for borrower_name, documents in processed_data.items():
        filtered_borrower_data = {}

        # Iterate through each document type for this borrower
        for doc_type, doc_list in documents.items():
            # Check if this document type is in our filter list (case-insensitive)
            if any(doc_type.lower() == filter_type.lower() for filter_type in document_types):
                filtered_borrower_data[doc_type] = doc_list

        # Only add borrower if they have at least one of the requested document types
        if filtered_borrower_data:
            filtered_data[borrower_name] = filtered_borrower_data

    return filtered_data


@app.on_event("startup")
async def startup_event():
    try:
        await mcp_client.connect()
        logger.info("MCP client connected successfully")
    except Exception as e:
        logger.error(f"Failed to connect MCP client: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    try:
        await mcp_client.cleanup()
        logger.info("MCP client cleanup completed")
    except Exception as e:
        logger.error(f"Error during MCP client cleanup: {e}")


@app.get("/")
async def root():
    return {"message": "Welcome to the Income Analyzer API"}


# ---------- MODELS ----------
class CleanJsonRequest(BaseModel):
    username: str
    email: str
    loanID: str
    file_name: str
    raw_json: Dict[str, Any]
    threshold: Optional[float] = 0.7
    borrower_indicators: Optional[List[str]] = None
    employer_indicators: Optional[List[str]] = None


class LoanViewRequest(BaseModel):
    email: str
    loanId: str


# --- Response model ---
class LoanViewResponse(BaseModel):
    cleaned_data: dict
    analyzed_data: bool
    hasModifications: bool  # ✅ NEW


class LoanGETResponse(BaseModel):
    cleaned_data: dict
    analyzed_data: bool


class GetAnalyzedDataRequest(BaseModel):
    email: str
    loanId: str


class SSOVerifyModel(BaseModel):
    token: str


# ---------- ROUTES ----------
@app.post("/clean-json")
async def clean_json(req: CleanJsonRequest):
    """Insert new record with cleaned data (first time upload)."""
    cleaned = clean_borrower_documents_from_dict(
        data=req.raw_json,
        # threshold=req.threshold,
        # borrower_indicators=req.borrower_indicators,
        # employer_indicators=req.employer_indicators,
    )

    cl_data = clean_json_data(cleaned)

    filtered_data = filter_documents_by_type(cl_data, allowed_sections)

    filtered_data_with_bs = filter_documents_by_type(
        cl_data, bs_allowed_sections)
    only_bs = filter_documents_by_type(cl_data, bank_statement)

    timestamp = datetime.now().strftime("%Y-%m-%d %I:%M:%S %p")

    record = {
        "username": req.username,
        "email": req.email,
        "loanID": req.loanID,
        "file_name": req.file_name,
        "original_data": req.raw_json,
        "cleaned_data": cleaned,
        "filtered_data": filtered_data,
        "original_cleaned_data": cleaned,
        "only_bs": only_bs,
        "filtered_data_with_bs": filtered_data_with_bs,
        "created_at": timestamp,
        "updated_at": timestamp,
    }

    await db["uploadedData"].insert_one(record)

    return {"message": "Upload saved successfully", "cleaned_json": cleaned}


@app.post("/update-cleaned-data")
async def update_cleaned_data(
    email: str = Body(...),
    loanID: str = Body(...),
    username: str = Body(...),
    action: str = Body(...),   # e.g. "folder_merge", "file_merge"
    # description: str = Body(...),
    raw_json: dict = Body(...),
    hasModifications: bool = Body(False)
):
    """Update cleaned_data for merges/moves and log into auditLogs."""

    timestamp = datetime.now().strftime("%Y-%m-%d %I:%M:%S %p")

    existing = await db["uploadedData"].find_one({"loanID": loanID, "email": email})
    if not existing:
        raise HTTPException(status_code=404, detail="Record not found")

    old_cleaned = existing.get("cleaned_data", {})

    cl_data = clean_json_data(raw_json)
    filtered_data = filter_documents_by_type(cl_data, allowed_sections)

    filtered_data_with_bs = filter_documents_by_type(
        cl_data, bs_allowed_sections)
    only_bs = filter_documents_by_type(cl_data, bank_statement)

    # Save new cleaned_data
    await db["uploadedData"].update_one(
        {"loanID": loanID},
        {"$set": {
            "cleaned_data": cl_data,
            "filtered_data": filtered_data,
            "only_bs": only_bs,
            "filtered_data_with_bs": filtered_data_with_bs,
            "hasModifications": hasModifications,
            "updated_at": timestamp
        }}
    )

    # Log audit entry
    await log_action(
        loanID=loanID,
        email=email,
        username=username,
        action=action,
        # description=description,
        old_cleaned_data=old_cleaned,
        new_cleaned_data=raw_json,
    )

    # Return updated cleaned_json from DB
    updated = await db["uploadedData"].find_one({"loanID": loanID, "email": email})
    return {
        "message": "Cleaned data updated successfully",
        "cleaned_json": updated.get("cleaned_data", {}),
    }


@app.get("/check-loanid")
async def check_loanid(email: str = Query(...), loanID: str = Query(...)):
    """Check if a loanID already exists for a given email"""
    existing = await db["uploadedData"].find_one({"loanID": loanID, "email": email})
    return {"exists": bool(existing)}


def convert_objectid(obj):
    if isinstance(obj, dict):
        return {k: convert_objectid(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_objectid(i) for i in obj]
    elif isinstance(obj, ObjectId):
        return str(obj)
    else:
        return obj


@app.post("/verify-rules")
async def verify_rules(
    email: str = Query(...),
    loanID: str = Query(...),
    borrower: str = Query("All")
):
    """Verify rules for previously uploaded borrower JSON"""
    content = await db["uploadedData"].find_one(
        {"loanID": loanID, "email": email},
        {"filtered_data": 1, "_id": 0}
    )

    if not content or "filtered_data" not in content:
        return {"status": "error", "results": [], "rule_result": {}}

    data = content["filtered_data"]

    # Handle borrower selection
    if borrower != "All":
        if borrower not in data:
            return {"status": "error", "results": [], "rule_result": {}}
        data = data[borrower]

    if not data:
        return {"status": "error", "results": [], "rule_result": {}}

    try:
        results = []
        rule_result = {"Pass": 0, "Fail": 0,
                       "Insufficient data": 0, "Error": 0}

        async with client_lock:
            for rule in requirements["rules"]:
                try:
                    response = await mcp_client.call_tool(
                        "rule_verification",
                        {"rules": rule, "content": json.dumps(data)}
                    )

                    if response.content and len(response.content) > 0 and response.content[0].text.strip():
                        parsed_response = json.loads(response.content[0].text)
                        if parsed_response["status"] == "Pass":
                            rule_result["Pass"] += 1
                        elif parsed_response["status"] == "Fail":
                            rule_result["Fail"] += 1
                        else:
                            rule_result["Insufficient data"] += 1
                    else:
                        rule_result["Error"] += 1
                        parsed_response = {
                            "error": "Empty response from MCP client"}

                except json.JSONDecodeError as e:
                    rule_result["Error"] += 1
                    logger.error(f"JSON decode error for rule {rule}: {e}")
                    parsed_response = {"error": "Invalid JSON response"}
                except Exception as e:
                    rule_result["Error"] += 1
                    logger.error(f"Rule verification error for {rule}: {e}")
                    parsed_response = {
                        "error": f"Verification failed: {str(e)}"}

                results.append({"rule": rule, "result": parsed_response})

        return {"status": "success", "results": results, "rule_result": rule_result}

    except Exception as e:
        logger.error(f"Rules verification failed: {e}")
        return {"status": "error", "results": [], "rule_result": {}}


@app.post("/income-calc")
async def income_calc(
    email: str = Query(...),
    loanID: str = Query(...),
    borrower: str = Query("All")
):
    """Calculate income for previously uploaded borrower JSON"""
    content = await db["uploadedData"].find_one(
        {"loanID": loanID, "email": email},
        {"filtered_data": 1, "_id": 0}
    )

    if not content or "filtered_data" not in content:
        return {"status": "error", "income": []}

    data = content["filtered_data"]

    if borrower != "All":
        if borrower not in data:
            return {"status": "error", "income": []}
        data = data[borrower]

    if not data:
        return {"status": "error", "income": []}

    try:
        final_response = []
        header_key = requirements["required_fields"].keys()
        for key in header_key:
            async with client_lock:
                try:
                    response = await mcp_client.call_tool(
                        "income_calculator",
                        {"fields": requirements["required_fields"]
                            [key], "content": json.dumps(data)},
                    )

                    if response.content and len(response.content) > 0 and response.content[0].text.strip():
                        parsed_response = json.loads(response.content[0].text)
                    else:
                        parsed_response = {
                            "error": "Empty response from MCP client"}

                except json.JSONDecodeError as e:
                    logger.error(
                        f"JSON decode error in income calculation: {e}")
                    parsed_response = {"error": "Invalid JSON response"}
                except Exception as e:
                    logger.error(f"Income calculation error: {e}")
                    parsed_response = {
                        "error": f"Calculation failed: {str(e)}"}
            final_response.append(parsed_response)

        return {"status": "success", "income": final_response}

    except Exception as e:
        logger.error(f"Income calculation failed: {e}")
        return {"status": "error", "income": [e]}


@app.post("/income-insights")
async def income_insights(
    email: str = Query(...),
    loanID: str = Query(...),
    borrower: str = Query("All")
):
    """Generate income insights for borrower JSON"""
    content = await db["uploadedData"].find_one(
        {"loanID": loanID, "email": email},
        {"filtered_data_with_bs": 1, "_id": 0}
    )

    if not content or "filtered_data_with_bs" not in content:
        return {"status": "error", "income_insights": {}}

    data = content["filtered_data_with_bs"]

    if borrower != "All":
        if borrower not in data:
            return {"status": "error", "income_insights": {}}
        data = data[borrower]

    if not data:
        return {"status": "error", "income_insights": {}}

    try:
        async with client_lock:
            try:
                response = await mcp_client.call_tool(
                    "income_insights",
                    {"content": json.dumps(data)},
                )

                if response.content and len(response.content) > 0 and response.content[0].text.strip():
                    parsed_response = json.loads(response.content[0].text)
                else:
                    parsed_response = {
                        "error": "Empty response from MCP client"}

            except json.JSONDecodeError as e:
                logger.error(f"JSON decode error in income insights: {e}")
                parsed_response = {"error": "Invalid JSON response"}
            except Exception as e:
                logger.error(f"Income insights error: {e}")
                parsed_response = {"error": f"Calculation failed: {str(e)}"}

        return {"status": "success", "income_insights": parsed_response}

    except Exception as e:
        logger.error(f"Income insights failed: {e}")
        return {"status": "error", "income_insights": e}


@app.post("/banksatement-insights")
async def banksatement_insights(email: str = Query(...), loanID: str = Query(...)):
    content = await db["uploadedData"].find_one({"loanID": loanID, "email": email}, {"only_bs": 1, "_id": 0})

    if not content:
        return {"status": "Failure", "income_insights": ['Insufficient documents for bank statement insights.']}

    content = content['only_bs']

    try:
        async def run_insights():
            try:
                response = await mcp_client.call_tool(
                    "bank_statement_insights",
                    {"content": json.dumps(content)},
                )
                if response.content and len(response.content) > 0 and response.content[0].text.strip():
                    parsed_response = json.loads(response.content[0].text)
                else:
                    parsed_response = {
                        "error": "Empty response from MCP client"}
            except Exception as e:
                parsed_response = {"error": str(e)}
            return parsed_response

        parsed_response = await run_insights()

        return {"status": "success", "income_insights": parsed_response}

    except Exception as e:
        logger.error(f"Income insights failed: {e}")
        return {"status": "success", "income_insights": e}


@app.post("/income-self_emp")
async def income_self_emp(
    email: str = Query(...),
    loanID: str = Query(...),
    borrower: str = Query("All")
):
    """Calculate income for previously uploaded borrower JSON"""
    content = await db["uploadedData"].find_one(
        {"loanID": loanID, "email": email},
        {"cleaned_data": 1, "_id": 0}
    )

    if not content or "cleaned_data" not in content:
        return {"status": "error", "income": {}}

    data = content["cleaned_data"]

    if borrower != "All":
        if borrower not in data:
            return {"status": "error", "income": {}}
        data = data[borrower]

    if not data:
        return {"status": "error", "income": {}}

    # print(data)
    try:
        async with client_lock:
            try:
                response = await mcp_client.call_tool(
                    "IC_self_income",
                    {"content": json.dumps(data)},
                )

                # print('response', response)

                if response.content and len(response.content) > 0 and response.content[0].text.strip():
                    parsed_response = json.loads(response.content[0].text)
                else:
                    parsed_response = {
                        "error": "Empty response from MCP client"}

            except json.JSONDecodeError as e:
                logger.error(f"JSON decode error in income calculation: {e}")
                parsed_response = {"error": "Invalid JSON response"}
            except Exception as e:
                logger.error(f"Income calculation error: {e}")
                parsed_response = {"error": f"Calculation failed: {str(e)}"}

        return {"status": "success", "income": parsed_response}

    except Exception as e:
        logger.error(f"Self employed Income calculation failed: {e}")
        return {"status": "success", "income": e}


@app.post("/store-analyzed-data")
async def store_analyzed_data(
    email: str = Body(...),
    loanID: str = Body(...),
    borrower: str = Body(...),
    analyzed_data: dict = Body(...)
):
    existing = await db["uploadedData"].find_one({"loanID": loanID, "email": email})
    if not existing:
        raise HTTPException(status_code=404, detail="Record not found")

    timestamp = datetime.now().strftime("%Y-%m-%d %I:%M:%S %p")

    # await db["uploadedData"].update_one(
    #     {"loanID": loanID, "email": email},
    #     {"$set": {"analyzed_data": analyzed_data, "updated_at": timestamp}}
    # )
    # Merge per borrower
    updated_analyzed = existing.get("analyzed_data", {})
    updated_analyzed[borrower] = analyzed_data

    await db["uploadedData"].update_one(
        {"loanID": loanID, "email": email},
        {"$set": {"analyzed_data": updated_analyzed, "updated_at": timestamp}}
    )

    return {"status": "success", "message": "Analyzed data stored"}


@app.post("/view-loan", response_model=LoanViewResponse)
async def view_loan(req: LoanViewRequest):
    # if loanId is an ObjectId, convert it
    # try:
    #     loan_id = ObjectId(req.loanId)
    # except:
    #     raise HTTPException(status_code=400, detail="Invalid loanId format")

    loan = await db["uploadedData"].find_one({"loanID": req.loanId})

    if not loan:
        raise HTTPException(
            status_code=404, detail="Loan not found for this email")

    return {
        "cleaned_data": loan.get("cleaned_data", {}),
        "analyzed_data": bool(loan.get("analyzed_data", False)),
        "hasModifications": bool(loan.get("hasModifications", False)),  # ✅ NEW
    }


@app.post("/get-original-data", response_model=LoanGETResponse)
async def view_loan(req: LoanViewRequest):
    # if loanId is an ObjectId, convert it
    # try:
    #     loan_id = ObjectId(req.loanId)
    # except:
    #     raise HTTPException(status_code=400, detail="Invalid loanId format")

    loan = await db["uploadedData"].find_one({"loanID": req.loanId})

    if not loan:
        raise HTTPException(
            status_code=404, detail="Loan not found for this email")

    return {
        "cleaned_data": loan.get("original_cleaned_data", {}),
        "analyzed_data": bool(loan.get("analyzed_data", False)),
    }


@app.post("/get-analyzed-data")
async def get_analyzed_data(req: GetAnalyzedDataRequest):
    loan = await db["uploadedData"].find_one({"loanID": req.loanId, "email": req.email})

    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")

    return {
        "analyzed_data": loan.get("analyzed_data", {})
    }


@app.get("/ValidateAzureAD")
async def login():
    print("************************* Azure AD Login Triggered *************************")

    load_dotenv()

    tenant_id = os.environ['TENANT_ID']
    number = random.randint(100000, 999999)
    unique_id = f"_{number}"
    issue_instant = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

    sso_login_url = f"https://login.microsoftonline.com/{tenant_id}/saml2"
    sso_reply_url = os.environ['SSO_REPLY_URL']

    # http://incomeanalyzer/api/SSOReplyURI
    # http://localhost:4000/api/SSOReplyURI
    # http://localhost:4000/api/SSOReplyURI

    application_base_url = "IncomeCalculator"
    # application_base_url = "IncomeCalculator"

    xml = f"""<samlp:AuthnRequest
    xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
    ID="{unique_id}"
    Version="2.0"
    IssueInstant="{issue_instant}"
    Destination="{sso_login_url}"
    AssertionConsumerServiceURL="{sso_reply_url}"
    ForceAuthn="false">
    <saml:Issuer>{application_base_url}</saml:Issuer>
    <samlp:NameIDPolicy
        Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
        AllowCreate="true"/>
</samlp:AuthnRequest>"""

    def deflate_raw(data: bytes) -> bytes:
        compressor = zlib.compressobj(level=9, wbits=-15)
        compressed = compressor.compress(data)
        compressed += compressor.flush()
        return compressed

    xml_bytes = xml.encode("utf-8")
    deflated = deflate_raw(xml_bytes)
    base64_encoded = base64.b64encode(deflated).decode("utf-8")
    url_encoded = urllib.parse.quote(base64_encoded)

    relay_state = "IncomeCalculator"
    redirect_url = f"{sso_login_url}?SAMLRequest={url_encoded}&RelayState={urllib.parse.quote(relay_state)}"

    print(f"Redirecting to: {redirect_url}")

    return RedirectResponse(url=redirect_url)


@app.post("/api/SSOReplyURI")
async def SSOReplyURI(req: Request):
    form = await req.form()
    saml_response = form.get("SAMLResponse")

    load_dotenv()

    if not saml_response:
        raise HTTPException(status_code=400, detail="Missing SAMLResponse")

    decoded_xml = base64.b64decode(saml_response).decode("utf-8")

    # Debug: Print the decoded XML to see the structure
    parsed = xmltodict.parse(decoded_xml)

    # Try different possible response keys
    response = (
        parsed.get("samlp:Response") or
        parsed.get("saml2p:Response") or
        parsed.get("Response") or
        parsed.get("{urn:oasis:names:tc:SAML:2.0:protocol}Response")
    )

    if not response:
        raise HTTPException(status_code=400, detail="Invalid SAML response")

    # Try different possible assertion keys
    assertion = (
        response.get("saml:Assertion") or
        response.get("saml2:Assertion") or
        response.get("Assertion") or
        response.get("{urn:oasis:names:tc:SAML:2.0:assertion}Assertion")
    )

    if not assertion:
        # Check for encrypted assertion
        encrypted = (
            response.get("saml:EncryptedAssertion") or
            response.get("saml2:EncryptedAssertion") or
            response.get("EncryptedAssertion")
        )
        if encrypted:
            raise HTTPException(
                status_code=400,
                detail="EncryptedAssertion received. Disable encryption or decrypt it."
            )

        raise HTTPException(status_code=400, detail="SAML Assertion missing")

    # Try different possible AttributeStatement keys
    attr_stmt = (
        assertion.get("saml:AttributeStatement", {}) or
        assertion.get("saml2:AttributeStatement", {}) or
        assertion.get("AttributeStatement", {})
    )

    # Try different possible Attribute keys
    attributes = (
        attr_stmt.get("saml:Attribute", []) or
        attr_stmt.get("saml2:Attribute", []) or
        attr_stmt.get("Attribute", [])
    )

    if isinstance(attributes, dict):
        attributes = [attributes]

    sso_email = None
    for attr in attributes:
        name = attr.get("@Name", "")

        if "email" in name.lower() or "mail" in name.lower():
            attr_value = (
                attr.get("saml:AttributeValue") or
                attr.get("saml2:AttributeValue") or
                attr.get("AttributeValue")
            )
            print(f"Found email attribute value: {attr_value}")

            # Handle different possible formats
            if isinstance(attr_value, dict):
                sso_email = attr_value.get("#text") or attr_value.get("text")
            elif isinstance(attr_value, str):
                sso_email = attr_value
            elif isinstance(attr_value, list) and len(attr_value) > 0:
                first_val = attr_value[0]
                if isinstance(first_val, dict):
                    sso_email = first_val.get("#text") or first_val.get("text")
                else:
                    sso_email = first_val

            if sso_email:
                break

    if not sso_email:
        print("Available attributes:", [
              attr.get("@Name", "unknown") for attr in attributes])
        raise HTTPException(status_code=400, detail="SSO email not found")

    temp_token = str(uuid.uuid4())
    SSO_TEMP_STORE[temp_token] = {
        "email": sso_email.lower(),
        "expires": datetime.utcnow() + timedelta(seconds=SSO_TOKEN_TTL)
    }

    # frontend_url = f"http://localhost:5173/sso?token={temp_token}"
    FRONTEND_URL = os.environ['FRONTEND_URL']
    frontend_url = f"{FRONTEND_URL}/sso?token={temp_token}"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta http-equiv="refresh" content="0; url={frontend_url}">
        <title>Redirecting...</title>
    </head>
    <body>
        <p>Redirecting to chat...</p>
        <script>
            window.location.href = "{frontend_url}";
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)


@app.post("/sso-exchange")
async def sso_exchange(payload: SSOVerifyModel):
    token = payload.token
    if not token:
        raise HTTPException(status_code=400, detail="Token required")

    data = SSO_TEMP_STORE.pop(token, None)
    if not data or data["expires"] < datetime.utcnow():
        raise HTTPException(
            status_code=401, detail="Invalid or expired SSO token")

    token_data = {
        "sub": data["email"],
        "email": data["email"]
    }

    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "email": data["email"],
        "role": "User",
        "status": "active",
        "is_first_time_user": False
    }


# ======================================
#  Entrypoint
# ======================================
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)
