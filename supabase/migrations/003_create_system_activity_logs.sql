CREATE TABLE IF NOT EXISTS system_activity_logs (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  agent_stage INTEGER,
  message TEXT,
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp 
ON system_activity_logs (timestamp DESC);
