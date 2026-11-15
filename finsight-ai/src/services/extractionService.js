const API_BASE_URL = 'http://127.0.0.1:8000'

export async function extractCompanyData(company) {
  const response = await fetch(`${API_BASE_URL}/api/extract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      company: company.trim(),
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.detail || 'Financial extraction failed.')
  }

  return data
}