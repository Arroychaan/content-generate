export async function callGroq(prompt, maxTokens = 1000) {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not defined');
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
      model: 'llama3-70b-8192', 
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
