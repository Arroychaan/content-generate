import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('content_drafts_registry')
      .select('id, topic_title, main_caption, thread_posts, platform_variants, image_r2_url, content_type, created_at')
      .eq('status', 'READY')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
