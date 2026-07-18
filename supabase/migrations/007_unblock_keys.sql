-- Unblock all Groq API keys that were erroneously blocked
UPDATE public.api_key_registry
SET status = 'ACTIVE', blocked_until = NULL
WHERE provider = 'groq' AND status = 'BLOCKED';
