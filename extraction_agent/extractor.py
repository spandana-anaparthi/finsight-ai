
import os
import json
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import types


# --------------------------------------------------
# CONFIGURATION
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")

API_KEY = os.getenv("GEMINI_API_KEY")

MODEL_NAME = "gemini-3.5-flash"


if not API_KEY:
    raise ValueError("Gemini API key not found in .env file")


# --------------------------------------------------
# INITIALIZE GEMINI
# --------------------------------------------------

client = genai.Client(api_key=API_KEY)


# --------------------------------------------------
# FINANCIAL INFORMATION EXTRACTION
# --------------------------------------------------

def extract_financial_information(search_results, company):

    if not search_results:
        return {
            "company": company,
            "financial_metrics": [],
            "financial_ratios": [],
            "performance_numbers": [],
            "status": "No relevant information found"
        }

    # Prepare document context
    context = ""

    for result in search_results:

        context += f"""
Source: {result['source']}
Chunk ID: {result['chunk_id']}

Content:
{result['text']}

------------------------------
"""

    # Instructions for Gemini
    prompt = f"""
You are the Financial Extraction Agent of Finsight AI.

Your task is to extract financial information
from the supplied annual report content.

Company: {company}

Extract the following:

1. Key financial metrics:
   - Revenue (may be reported as "Net sales")
   - Net income
   - Operating income
   - Total assets
   - Total liabilities
   - Shareholders' equity
   - Operating cash flow
   - Investing cash flow
   - Financing cash flow

2. Financial ratios:
   - Current ratio
   - Debt-to-equity ratio
   - Net profit margin
   - Return on assets
   - Return on equity

3. Performance numbers:
   - Revenue growth
   - Profit growth
   - Year-over-year changes

IMPORTANT RULES:

- Extract only values supported by the supplied text.
- Never invent missing financial values.
- Preserve the original currency and units.
- Identify the financial year wherever possible.
- Include the source filename and chunk ID.
- Distinguish reported values from calculated values.
- Only calculate ratios when the required inputs are available.
- Use null for unavailable values.
- Include supporting evidence for every extracted value.

Return valid JSON only, using this structure:

{{
    "company": "{company}",
    "financial_metrics": [],
    "financial_ratios": [],
    "performance_numbers": [],
    "status": "success"
}}

DOCUMENT CONTENT:

{context}
"""

    # Send request to Gemini
    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.1,
            response_mime_type="application/json"
        )
    )

    # Convert JSON response into Python dictionary
    extracted_data = json.loads(response.text)

    return extracted_data
