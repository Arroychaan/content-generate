import { NextResponse } from 'next/server';
import { runPipelineCycle } from '../../../../pipeline/PipelineCoordinator';
import { isSystemRunning } from '../../../../services/system/SystemControlManager';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const running = await isSystemRunning();
    if (!running) {
      console.log('🛑 Cron trigger ignored: System is STOPPED.');
      return NextResponse.json({ 
        success: false, 
        message: 'Pipeline blocked. System status is STOPPED by admin command.' 
      });
    }

    console.log('Triggering pipeline cycle from cron...');
    runPipelineCycle().catch(console.error);

    return NextResponse.json({ success: true, message: 'Pipeline triggered' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
