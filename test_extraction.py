
import json

# Import existing Document Agent functions
from document_agent.search_documents import (
    load_search_engine,
    search_documents
)

# Import our new Extraction Agent
from extraction_agent.extractor import (
    extract_financial_information
)


# --------------------------------------------------
# STEP 1: LOAD DOCUMENT AGENT
# --------------------------------------------------

print("\nLoading Document Agent...")

(
    embeddings,
    metadata,
    tokenizer,
    session,
    input_names
) = load_search_engine()

print("Document Agent ready!")


# --------------------------------------------------
# STEP 2: SEARCH FINANCIAL DOCUMENTS
# --------------------------------------------------

# --------------------------------------------------
# STEP 2: SEARCH FINANCIAL DOCUMENTS
# --------------------------------------------------

company = "Amazon"

queries = [
    "Amazon annual report revenue net sales net income operating income",

    "Amazon annual report balance sheet total assets total liabilities shareholders equity current assets current liabilities",

    "Amazon annual report statement of cash flows operating activities investing activities financing activities"
]

print(f"\nSearching {company} documents...")

results = []

for query in queries:

    print(f"\nSearching: {query}")

    search_results = search_documents(
        query=query,
        embeddings=embeddings,
        metadata=metadata,
        tokenizer=tokenizer,
        session=session,
        input_names=input_names,
        top_k=5,
        company=company
    )

    results.extend(search_results)

print(f"\nTotal retrieved chunks: {len(results)}")
# DEBUG: Inspect retrieved financial information

for i, result in enumerate(results, start=1):

    print(f"\n========== CHUNK {i} ==========")
    print("Source:", result.get("source"))
    print("Chunk ID:", result.get("chunk_id"))
    print("Score:", result.get("score"))
    print("Content:")
    print(result.get("text"))

# --------------------------------------------------
# STEP 3: RUN EXTRACTION AGENT
# --------------------------------------------------

print("\nStarting Financial Extraction Agent...")

extracted_data = extract_financial_information(
    search_results=results,
    company=company
)


# --------------------------------------------------
# STEP 4: DISPLAY EXTRACTED INFORMATION
# --------------------------------------------------

print("\n========================================")
print("       FINSIGHT AI EXTRACTION RESULTS")
print("========================================")

print(json.dumps(
    extracted_data,
    indent=4,
    ensure_ascii=False
))

# Save output
output_dir = "extraction_outputs"
import os
os.makedirs(output_dir, exist_ok=True)

output_path = os.path.join(
    output_dir,
    "amazon_extracted_data.json"
)

with open(output_path, "w", encoding="utf-8") as file:
    json.dump(
        extracted_data,
        file,
        indent=4,
        ensure_ascii=False
    )

print(f"\nResults saved to: {output_path}")
