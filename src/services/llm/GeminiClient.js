export async function callGemini(apiKey, prompt, model = 'gemini-2.5-flash', maxTokens = 1000) {
  // Using standard Google Gemini API endpoint structure
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.3
      }
    })
  });

  if (response.status === 429) {
    throw new Error('QUOTA_EXCEEDED');
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  try {
    return data.candidates[0].content.parts[0].text;
  } catch (e) {
    console.error('Failed to parse Gemini response:', data);
    throw new Error('Invalid response format from Gemini');
  }
}
