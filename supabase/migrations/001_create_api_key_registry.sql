CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS api_key_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'gemini',
  api_key_encrypted TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  daily_usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient LRU querying
CREATE INDEX IF NOT EXISTS idx_api_key_registry_status_last_used 
ON api_key_registry (status, last_used_at ASC);
