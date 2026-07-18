import { supabaseAdmin } from '../../lib/supabase';

export async function checkNextContentType() {
  // Query the last 2 published or ready drafts to determine the 2:1 ratio (2 Text : 1 Image)
  const { data, error } = await supabaseAdmin
    .from('content_drafts_registry')
    .select('content_type')
    .order('created_at', { ascending: false })
    .limit(2);

  if (error || !data || data.length === 0) {
    return 'IMAGE'; // Default start
  }

  // If the last one was IMAGE, next 2 must be TEXT_ONLY
  if (data[0].content_type === 'IMAGE') {
    return 'TEXT_ONLY';
  }
  
  // If last one was TEXT, check the one before
  if (data[0].content_type === 'TEXT_ONLY' && data.length > 1 && data[1].content_type === 'IMAGE') {
    return 'TEXT_ONLY';
  }

  // If last two were TEXT_ONLY, next one is IMAGE
  return 'IMAGE';
}
