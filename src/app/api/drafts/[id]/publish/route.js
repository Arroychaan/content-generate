import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase';

export async function POST(request, { params }) {
  try {
    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('content_drafts_registry')
      .update({
        status: 'PUBLISHED',
        published_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Draft marked as published' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
