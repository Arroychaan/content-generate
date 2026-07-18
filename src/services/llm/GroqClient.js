export async function callGroq(apiKey, prompt, model = 'llama-3.3-70b-versatile', maxTokens = 1000) {
  if (!apiKey) {
    throw new Error('API key is not defined');
  }

  // Groq API Endpoint (OpenAI compatible)
  const endpoint = 'https://api.groq.com/openai/v1/chat/completions';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model, 
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: maxTokens,
      temperature: 0.3
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  try {
    return data.choices[0].message.content;
  } catch (e) {
    console.error('Failed to parse Groq response:', data);
    throw new Error('Invalid response format from Groq');
  }
}
