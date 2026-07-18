import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const authKey = searchParams.get('key');
    const CRON_SECRET = process.env.CRON_SECRET;

    // Simple Authentication using the existing Cron Secret
    if (!authKey || authKey !== CRON_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized Access' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('system_activity_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
