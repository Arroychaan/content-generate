import { NextResponse } from 'next/server';
import { getSystemStatus, setSystemStatus } from '../../../../services/system/SystemControlManager';
import { runPipelineCycle } from '../../../../pipeline/PipelineCoordinator';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key !== process.env.CRON_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const status = await getSystemStatus();
    return NextResponse.json({ success: true, status });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { key, action } = body;

    if (key !== process.env.CRON_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let newStatus = 'RUNNING';
    if (action === 'STOP' || action === 'BERHENTI') {
      newStatus = 'STOPPED';
    } else if (action === 'START' || action === 'MULAI') {
      newStatus = 'RUNNING';
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action. Use START or STOP.' }, { status: 400 });
    }

    const currentStatus = await setSystemStatus(newStatus);

    // If started, trigger pipeline cycle immediately
    if (currentStatus === 'RUNNING') {
      console.log('🚀 Triggering pipeline cycle immediately upon START...');
      runPipelineCycle().catch(console.error);
    }

    return NextResponse.json({
      success: true,
      status: currentStatus,
      message: currentStatus === 'RUNNING' 
        ? 'Sistem berhasil dijalankan (MULAI). Agen AI siap beraksi!' 
        : 'Sistem berhasil dihentikan (BERHENTI). Tidak ada agen yang berjalan.'
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
