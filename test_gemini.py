import os
from dotenv import load_dotenv
from google import genai

# Load environment variables
load_dotenv()

# Get API key
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("Gemini API key not found!")

# Create Gemini client
client = genai.Client(api_key=api_key)

# Test API connection
response = client.models.generate_content(
    model="gemini-3.5-flash",
    contents="Say Hello to Finsight AI!"
)

print("Gemini API connected successfully!")
print(response.text)