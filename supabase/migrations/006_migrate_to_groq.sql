-- Wipe out banned/failed Gemini keys and the old DeepSeek key
DELETE FROM public.api_key_registry 
WHERE provider IN ('gemini', 'deepseek');

-- Insert the new Groq LPU API Key
INSERT INTO public.api_key_registry (provider, api_key_encrypted, status)
VALUES ('groq', 'YOUR_GROQ_API_KEY_HERE', 'ACTIVE');
