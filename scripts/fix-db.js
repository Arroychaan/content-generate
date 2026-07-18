import { supabaseAdmin } from '../src/lib/supabase.js';

async function main() {
  const { data: drafts, error } = await supabaseAdmin
    .from('content_drafts_registry')
    .select('id, image_r2_key, image_r2_url')
    .eq('content_type', 'IMAGE');

  if (error) {
    console.error('Error fetching drafts:', error);
    return;
  }

  console.log(`Found ${drafts.length} drafts to refresh URLs for`);

  for (const draft of drafts) {
    if (draft.image_r2_key) {
      // Remove trailing slash from R2_PUBLIC_URL if it exists to prevent double slashes
      const baseUrl = process.env.R2_PUBLIC_URL.replace(/\/$/, '');
      const publicUrl = `${baseUrl}/${draft.image_r2_key}`;
      
      const { error: updateError } = await supabaseAdmin
        .from('content_drafts_registry')
        .update({ image_r2_url: publicUrl })
        .eq('id', draft.id);
      
      if (updateError) {
        console.error(`Failed to update ${draft.id}:`, updateError);
      } else {
        console.log(`Updated ${draft.id} with URL: ${publicUrl}`);
      }
    }
  }
}

main().catch(console.error);
