-- Create system_settings table to store master control switches and config
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initialize SYSTEM_STATUS to RUNNING by default
INSERT INTO public.system_settings (key, value)
VALUES ('SYSTEM_STATUS', 'RUNNING')
ON CONFLICT (key) DO NOTHING;
