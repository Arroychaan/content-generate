import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Trigger Janitor Stored Procedure
    const { error } = await supabaseAdmin.rpc('execute_daily_janitor_cleanup');

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Janitor cleanup completed' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
