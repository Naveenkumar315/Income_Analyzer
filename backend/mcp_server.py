import uvicorn
import argparse
from typing import List, Literal
from dotenv import load_dotenv

from mcp.server.fastmcp import FastMCP
from langchain_openai import AzureChatOpenAI
from langgraph.prebuilt import create_react_agent
from langchain.output_parsers import PydanticOutputParser
from langchain.tools import tool

from pydantic import BaseModel
import os

# ======================================
#  Environment Setup
# ======================================
load_dotenv(dotenv_path=".env_1")

# Loading the environment variables
azure_deployement = os.environ['AZURE_OPENAI_DEPLOYMENT']
az_api_version = os.environ['AZURE_API_VERSION']

# Initiating the LLM
llm = AzureChatOpenAI(
    azure_deployment=azure_deployement,
    api_version=az_api_version,
    temperature=0,
    max_retries=2,
)

# MCP Server Init
mcp = FastMCP(
    name="Mortgage Income Calculation & Rule Verifier",
    json_response=True,
)

# Agent (no external tools yet)


@tool
def math_tool(expression: str) -> str:
    """Safely evaluate a math expression for underwriting calculations."""
    try:
        result = eval(expression, {"__builtins__": {}})
        return str(round(float(result), 2))
    except Exception as e:
        return f"null"


agent = create_react_agent(llm, tools=[math_tool])

bank_agent = create_react_agent(llm, tools=[math_tool])
# ======================================
#  Models
# ======================================


class ICField(BaseModel):
    field: str
    value: str
    status: Literal['Pass', 'Fail']
    calculation_commentry: str
    commentary: str


class ICFields(BaseModel):
    checks: List[ICField]


class RuleCheckResult(BaseModel):
    rule: str
    status: Literal['Pass', 'Fail', 'Insufficient data']
    commentary: str


class IC_insights(BaseModel):
    insight_commentry: str


class IC_Bank_Field(BaseModel):
    field: str
    calculation_commentry: str
    commentary: str
    value: str


class IC_bank_Fields(BaseModel):
    insight_commentry: List[IC_Bank_Field]


class IC_self_Field(BaseModel):

    """
    Output Structure for the Wage earner income calculation
    """
    borrower_type: str
    status: Literal['Pass', 'Fail']
    Documents_used: List
    calculation_commentry: str
    commentary: str
    formulas_applied: str
    final_math_formula: str


# Parsers
ic_parser = PydanticOutputParser(pydantic_object=ICFields)
rule_parser = PydanticOutputParser(pydantic_object=RuleCheckResult)
insight_parser = PydanticOutputParser(pydantic_object=IC_insights)
bank_parser = PydanticOutputParser(pydantic_object=IC_bank_Fields)
IC_self_parser = PydanticOutputParser(pydantic_object=IC_self_Field)


# ======================================
#  Prompt Templates
# ======================================

@mcp.prompt()
def rule_verification_prompt(rules, content) -> str:
    """
    Prompt template for mortgage loan rule verification.
    """
    prompt = f"""
    Act as a Senior Mortgage Loan Rule Verifier.

    Given the extracted loan information and rules to evaluate,
    verify whether the rules are satisfied.

    ---
    Rules:
    {rules}
    ---

    Loan details:
    {content}
    ---

    """
    return prompt


@mcp.prompt()
def loan_insights_prompt(content) -> str:

    prompt = f"""

ROLE:
You are a Senior Mortgage Analyst with 15+ years of experience in residential loan underwriting and quality control. Your expertise includes Fannie Mae/Freddie Mac guidelines, fraud detection, document verification, and risk assessment. Analyze the provided loan documentation and deliver a focused, detailed findings report.

---

CRITICAL INSTRUCTION:
Produce a DETAILED REPORT with specific findings from the actual documents provided. Do NOT summarize the process. Do NOT calculate income. Focus on: document authenticity, consistency across documents, compliance with guidelines, employment verification, deposit patterns, and fraud indicators. Report specific findings with exact numbers, dates, names, and observations.

---

ANALYSIS PROTOCOL

PHASE 1: DOCUMENT INVENTORY
List each document with key details:
- W-2s: tax year, employer name, EIN, Box 1 amount, employee name, document quality
- Paystubs: pay date, employer, gross pay, YTD, net pay, deductions, pay frequency, document format
- VOE: date, method, employer, position, hire date, salary, verifier name/title
- Bank statements: institution, period covered, account type, number of statements

PHASE 2: CONSISTENCY CHECK
Compare across all documents:
- Employer name spelling and format
- EIN numbers
- Employee name variations
- Addresses
- Date alignments

PHASE 3: EMPLOYMENT VERIFICATION
- VOE timeliness vs. note date
- VOE completeness per B3-3.2
- Employment history continuity
- Verifier credibility

PHASE 4: DEPOSIT RECONCILIATION
- Identify payroll deposits in bank statements
- Match deposits to paystub net amounts
- Note missing or mismatched deposits
- Flag unusual deposits

PHASE 5: FRAUD DETECTION
Check for:
- Document alteration signs
- Employer verification issues
- Income reasonableness
- Deposit irregularities
- Collusion indicators

PHASE 6: GUIDELINE COMPLIANCE
Verify against Fannie Mae B3-3.1, B3-3.2, B3-4.2

---
Loan Details:

{content}

---


OUTPUT FORMAT

================================================================================
LOAN FILE ANALYSIS REPORT
================================================================================

BORROWER: [Name]
DOCUMENTS ANALYZED: [List]

================================================================================

SECTION 1: VALID INCOME FINDINGS

For each validated income source:

EMPLOYER: [Name]

Documentation Present:
- W-2 2023: Box 1 Wages [amount], EIN [number], authentic appearance
- W-2 2022: Box 1 Wages [amount], EIN [number], authentic appearance
- Paystub [date]: Gross [amount], YTD [amount], Net [amount], professional format
- VOE [date]: Position [title], Hire date [date], Salary [amount], verified by [name/title]

Deposit Verification:
- Bank statements show [frequency] deposits matching paystubs
- Example: [Date] deposit [amount] matches paystub net [amount]
- All expected deposits present: Yes/No

Consistency: Employer name, EIN, employee name consistent across documents: Yes/No

Compliance: Meets B3-3.1, B3-3.2, B3-4.2 requirements: Yes/No with brief explanation

Authenticity: Documents appear genuine with no manipulation indicators: Yes/No

================================================================================

SECTION 2: GUIDELINE EXCEPTIONS OR RISKS

For each issue:

ISSUE: [Clear description]
DOCUMENTS: [Affected documents]
GUIDELINE: [Fannie Mae section]
RISK LEVEL: High/Medium/Low
IMPACT: [Explanation]
ACTION REQUIRED: [Specific steps]

Example:
ISSUE: VOE dated 45 business days before note date, exceeds 10-day requirement
GUIDELINE: B3-3.2
RISK LEVEL: Medium
ACTION REQUIRED: Obtain new verbal VOE within 10 days of closing

================================================================================

SECTION 3: POTENTIAL FRAUD INDICATORS

For each red flag:

CATEGORY: [Document Manipulation/Identity/Income/Employment/Deposits/Collusion]
FINDING: [Specific observation with document reference]
SEVERITY: Critical/Significant/Minor
EVIDENCE: [What was found or missing]
RECOMMENDATION: [Action needed]

Example:
CATEGORY: Deposit Irregularity
FINDING: Paystub dated 11/15/2024 net pay 3,247 dollars - no matching deposit in bank statement within 10 days
SEVERITY: Critical
RECOMMENDATION: Suspend file, require third-party employment verification

================================================================================

SECTION 4: MISCELLANEOUS OBSERVATIONS

- Document quality concerns
- Positive factors (long tenure, stable employer, clean history)
- Minor inconsistencies requiring clarification
- Processing recommendations

================================================================================

SUMMARY ASSESSMENT

OVERALL RISK: Low/Medium/High
RECOMMENDATION: Clear to Close/Conditions Required/Suspended/Declined
KEY ACTIONS: [List 3-5 critical next steps]

================================================================================

"""
    return prompt


@mcp.prompt()
def bank_statemnt_prompt(content) -> str:

    promt = f"""

ROLE:  
You are a Senior Bank Analyst with expertise in Fannie Mae underwriting guidelines. Your task is to analyze the provided bank statement and generate a structured, professional report.

---

OBJECTIVE  
Review the bank statement to assess:
    - Income stability: Verify deposits match verified income sources such as paystubs, W-2s, or employer deposits.  
    - Recurring deposits: Check that monthly deposits are consistent and sufficient.  
    - Withdrawals and spending patterns: Identify unusual or large withdrawals.  
    - NSF/Overdraft occurrences: Identify repeated instances that could indicate financial instability.  
    - Average monthly balance: Highlight months with abnormally low balances.  
    - Fannie Mae compliance: Ensure all account activity aligns with qualifying income requirements.

---

content of the bank statement:
{content}

---

FIELDS TO CALCULATE  
1. Average Monthly Deposit – Calculate the mean of all monthly deposits; verify recurring deposits according to Fannie Mae guidelines.  
2. Average Monthly Withdrawal – Calculate the mean of all monthly withdrawals; flag unusual or irregular transactions.  
3. Average Monthly NSF & Overdraft – Calculate the mean of monthly NSF or overdraft occurrences; highlight repeated issues affecting qualifying income.  
4. Average Monthly Balance – Calculate the average ending monthly balance; flag months with abnormally low balances.

---

OUTPUT STRUCTURE

1. CALCULATION COMMENTARY  
For each metric:  
Step 1: Identify data sources including month, year, and transaction details.  
Step 2: Apply the calculation method (state explicitly, e.g., average of monthly deposits).  
Step 3: Show mathematical computation using actual numbers from the statement.  
Step 4: Present the final derived figure.  
Step 5: Include Fannie Mae guideline check:
  - Are deposits recurring and matching verified income?  
  - Are withdrawals reasonable and not affecting qualifying income?  
  - Are NSF or overdraft occurrences minimal or repeated?  

2. PROFESSIONAL COMMENTARY  
For each transaction, provide:  
Date  
Transaction Description / Entity  
Deposit or Withdrawal Amount  
Transaction Type (Deposit, Withdrawal, NSF/Overdraft, Fee)  
Analyst Remark:
  - Deposit consistency with verified income  
  - Reasonableness of withdrawals  
  - Relevance of NSF/Overdraft to qualifying income  
  - Alignment with Fannie Mae rules for recurring income and account behavior  

---

INSTRUCTIONS  
Maintain a professional analyst tone.  
Use only the values present in the bank statement; do not make assumptions.  
Separate calculation commentary and professional commentary clearly.  
Conclude with a summary assessing:
- Income stability  
- Account health  
- Any Fannie Mae compliance concerns

---
"""
    return promt


@mcp.prompt()
def ic_calculation_prompt(fields, content) -> str:
    """
    Professional prompt template for mortgage income calculation.
    """
    return f"""
You are a senior U.S. mortgage underwriter. Perform qualifying income calculations for each income component using strict underwriting discipline.
Use `math_tool` for the calculation
Rules:
- Must Use `math_tool` for all the math related calculation

- Base Income calculation: Use only one applicable method below (prefer VOE to calculate) (calculate using math tool):
  - Hourly = hourly rate × avg weekly hours × 52 ÷ 12
  - Annual salary ÷ 12
  - Monthly = gross monthly amount
  - Twice monthly = Twice monthly amount × 2
  - Biweekly = (Biweekly amount × 26) ÷ 12
  - Weekly = (Weekly amount × 52) ÷ 12
  
- Variable Income calculation (bonus, overtime, commission, other) (prefer VOE to calculate) (calculate using math tool):
  - ≥12 months required (24 preferred for commission)
  - If Stable/increasing → average YTD + prior year(s)
  - If Declining → use lower current figure
- Qualifying Income Formula (calculate using math tool):
  Total Monthly Income = Base + Bonus + Overtime + Commission + Other 

AVAILABLE DOCUMENTATION: 
{content} 

---

FIELDS TO CALCULATE:
 {fields}
 ---

FIELD NAME: [Income Component]

CALCULATION COMMENTARY:(Strictly Use math tool for calculation)
    - Step 1: Identify data sources, and mention the value used from the document with year.
    - Step 2: Apply the chosen income method (state explicitly which one)
    - Step 3: Show math with actual numbers
    - Step 4: Final derived qualifying figure 

PROFESSIONAL COMMENTARY:
    - Mention the raw value used from the document.
    - Mention the document type with the year.
    - Reason for choosing the document and value.


VALUE: $[Derived monthly amount from calculation commentary]

Additional Rules to be followed:
- All calculations must use the math tool.
- VALUE must equal the final figure from Calculation Commentary.

    """


@mcp.prompt()
def self_employment_prompt(content) -> str:

    prompt = f"""

[INPUT SECTION]

Below is the borrower’s loan file content. Review it carefully and extract all relevant financial information to determine qualifying income.

<<BORROWER DOCUMENT CONTENT START>>
{content}
<<BORROWER DOCUMENT CONTENT END>>

----------------------------------------------------
ROLE AND OBJECTIVE
----------------------------------------------------
You are an expert mortgage underwriter specializing in self-employed income analysis.  
Your goal is to calculate the borrower’s qualifying monthly income using the provided documentation (tax returns, P&L, K-1s, financial statements, etc.).  
You must identify each income source, apply correct formulas, include or exclude add-backs appropriately, and present the final qualifying income clearly.

----------------------------------------------------
INSTRUCTIONS
----------------------------------------------------
1. Identify the borrower’s self-employment type (Sole Proprietorship, Partnership, S-Corp, or Corporation).  
2. Extract relevant fields such as:
   - Net Profit / Ordinary Business Income
   - Depreciation, Depletion, Amortization
   - Nonrecurring or One-Time Income
   - W-2 wages (if applicable)
   - Ownership percentage
   - YTD P&L or tax return figures
3. Apply category-specific formulas as defined below.
4. If multiple years are provided, compute a two-year average unless income is declining.
5. Show intermediate steps and the final monthly qualifying income.

----------------------------------------------------
CATEGORY-WISE CALCULATION LOGIC
----------------------------------------------------

>> SOLE PROPRIETORSHIP (Schedule C)
Data Source: IRS Form 1040 Schedule C – Line 31 (Net Profit)

Formula:
Qualifying Income = [(Net Profit + Non-cash Add-backs) − Nonrecurring Income] ÷ 12

Add-backs may include:
- Depreciation (Line 13)
- Depletion (Line 12)
- Business Use of Home (Line 30)
- Amortization or Non-cash Expenses

Two-Year Average:
Avg Income = [(Year 1 Adj Net Income + Year 2 Adj Net Income) ÷ 24]
If most recent year is lower → use lower year only.

----------------------------------------------------

>> PARTNERSHIP / S-CORPORATION (Form 1065 / 1120S)
Data Source: Schedule K-1 (Lines 1, 2, 4), Form 8825 if applicable

Formula:
Qualifying Income = [(Ordinary Business Income + Guaranteed Payments + Depreciation + Depletion + Amortization) − Nonrecurring Items] ÷ 12

If Borrower Owns ≥ 25% of Business:
- Include share of income proportional to ownership %
- Add W-2 wages if borrower is salaried
- Subtract distributions greater than available cash flow

Two-Year Average:
Avg Monthly = (Adj Income Yr1 + Adj Income Yr2) ÷ 24

----------------------------------------------------

>> CORPORATION (Form 1120)
Data Source: Form 1120 – Line 28 (Taxable Income before NOL)

Formula:
Qualifying Income = [(Taxable Income + Officer Compensation + Depreciation + Depletion + Amortization) − Nonrecurring Income] ÷ 12

If Borrower Owns ≥ 25%:
- Add salary paid to borrower (W-2)
- Confirm positive business cash flow (review balance sheet)
- Use two-year average if stable/increasing

Formula Example:
= [(Taxable Income (L28) + Depreciation (L20) + Officer Comp (L12)) ÷ 12]

----------------------------------------------------

>> PARTNERSHIP INCOME FROM K-1 (<25% OWNERSHIP)
Data Source: Schedule K-1

Formula:
Qualifying Income = (K-1 Ordinary Business Income × Ownership %) ÷ 12
No add-backs unless borrower can prove access to funds.

----------------------------------------------------

>> PROFIT & LOSS (P&L) STATEMENT VALIDATION
When P&L and bank statements are available:

Monthly Income = (YTD Net Income + Add-backs) ÷ Number of Months Covered

Add-backs include:
- Depreciation
- Depletion
- Amortization
- Nonrecurring expenses

If trend is consistent → average with prior year tax returns.

----------------------------------------------------

COMMON ADD-BACKS AND ADJUSTMENTS
| Category | Add Back/Subtract | Example |
|-----------|------------------|----------|
| Depreciation | + | Net Income + Depreciation |
| Depletion | + | Net Income + Depletion |
| Amortization | + | Net Income + Amortization |
| Nonrecurring Income | − | Adj Income − One-Time Gain |
| Meals/Entertainment (50% Deductible) | + | Adj Income + (Disallowed Portion) |

----------------------------------------------------

FINAL QUALIFYING INCOME FORMULA
Final Monthly Qualifying Income = [(Adj Net Income Year1 + Adj Net Income Year2) ÷ 24]
If Year 2 < Year 1 → use Year 2 adjusted monthly only.

----------------------------------------------------
OUTPUT FORMAT
----------------------------------------------------

  "borrower_type": "Self-Employed",
  Documents_used: k-1, schedule c
  CALCULATION COMMENTARY:
            - Step 1: VOE 10/21/2017
            - Step 2: The Depreciation for 2019 is 122.00 and for 2018 is 22.00.
            - Step 3: The value over the two years is (122.00 + 22.00) / 24.

    PROFESSIONAL COMMENTARY:
            - Mention the raw value used from the document.
            - Mention the document type with the year.
            - Reason for choosing the document and value.
  "formulas_applied": [
    "(Net Profit + Depreciation + Amortization - Nonrecurring Income) / 12",
    "(Adj Yr1 + Adj Yr2) / 24"
  ],
  "final_math_formula": "(12+34+2-34)/12"

---

final_math_formula should be full mathematical expression

If the content is not enough return status as fail and add comment is commentry and return all the fields as `0`.

"""

    return prompt


# ======================================
#  Tools
# ======================================

@mcp.tool()
async def rule_verification(rules: str, content: str):
    """
    Verify mortgage loan rules against extracted loan details.
    """
    try:
        user_prompt = rule_verification_prompt(rules, content)
        user_prompt += f"\n\n{rule_parser.get_format_instructions()}"

        prompt = {
            "messages": [
                {"role": "user", "content": user_prompt}
            ]
        }

        raw_output = await agent.ainvoke(prompt)
        output = raw_output['messages'][-1].content
        return rule_parser.parse(output).dict()
    except Exception as e:
        return f'Error: {e}'


@mcp.tool()
async def income_calculator(fields: List[str], content: str):
    """
    Income calculation tool for mortgage loan files.
    """

    try:
        ic_prompt = ic_calculation_prompt(fields, content)
        ic_prompt += f"\n\n{ic_parser.get_format_instructions()}"
        prompt = {
            "messages": [
                {"role": "user", "content": ic_prompt}
            ]
        }

        raw_output = await agent.ainvoke(prompt)
        output = raw_output['messages'][-1].content

        return ic_parser.parse(output).dict()

    except Exception as e:
        return f'Error: {e}'


@mcp.tool()
async def income_insights(content: str):

    try:
        insight_prompt = loan_insights_prompt(content)
        insight_prompt += f"\n\n{insight_parser.get_format_instructions()}"
        prompt = {
            "messages": [
                {"role": "user", "content": insight_prompt}
            ]
        }

        raw_output = await agent.ainvoke(prompt)
        output = raw_output['messages'][-1].content

        return insight_parser.parse(output).dict()

    except Exception as e:
        return f'Error: {e}'


@mcp.tool()
async def bank_statement_insights(content: str):

    try:
        insight_prompt = bank_statemnt_prompt(content)
        insight_prompt += f"\n\n{bank_parser.get_format_instructions()}"
        prompt = {
            "messages": [
                {"role": "user", "content": insight_prompt}
            ]
        }

        raw_output = await agent.ainvoke(prompt)
        output = raw_output['messages'][-1].content

        return bank_parser.parse(output).dict()

    except Exception as e:
        return f'Error: {e}'


@mcp.tool()
async def IC_self_income(content):

    try:
        self_emp_prompt = self_employment_prompt(content)
        self_emp_prompt += f"\n\n{IC_self_parser.get_format_instructions()}"
        prompt = {
            "messages": [
                {"role": "user", "content": self_emp_prompt}
            ]
        }

        raw_output = await agent.ainvoke(prompt)
        output = raw_output['messages'][-1].content

        data = IC_self_parser.parse(output).dict()

        data['value'] = math_tool(data['final_math_formula'])

        return data

    except Exception as e:
        return f'Error: {e}'


# ======================================
#  Entrypoint
# ======================================

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Run MCP Mortgage Income & Rule Verifier server")
    parser.add_argument("--host", type=str,
                        default="0.0.0.0", help="Host to bind")
    parser.add_argument("--port", type=int, default=8000,
                        help="Port to listen on")
    args = parser.parse_args()

    uvicorn.run(mcp.streamable_http_app, host=args.host, port=args.port)
