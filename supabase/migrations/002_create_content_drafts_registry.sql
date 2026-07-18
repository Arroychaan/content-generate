CREATE TABLE IF NOT EXISTS content_drafts_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_title TEXT NOT NULL,
  source_urls JSONB,
  quality_score NUMERIC(3,1),
  main_caption TEXT,
  thread_posts JSONB,
  platform_variants JSONB,
  image_r2_url TEXT,
  image_r2_key TEXT,
  content_type TEXT DEFAULT 'IMAGE',
  status TEXT DEFAULT 'PROCESSING',
  pipeline_stage INTEGER DEFAULT 1,
  pipeline_error_log TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_content_drafts_status_created 
ON content_drafts_registry (status, created_at DESC);
