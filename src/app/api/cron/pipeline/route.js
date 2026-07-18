import { NextResponse } from 'next/server';
import { runPipelineCycle } from '../../../../pipeline/PipelineCoordinator';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Trigger pipeline asynchronously (don't block the request)
    // Next.js might kill background tasks in Serverless environment if not careful,
    // For Vercel, if this exceeds the max duration, the function terminates.
    // Ensure timeout is configured in next.config.mjs or Vercel settings.
    
    // We await it here so Vercel doesn't kill the process immediately,
    // but the max duration should be high enough (e.g. 5 mins for pro).
    // In free tier, it's 10-15s, which might be an issue. If so, a more 
    // robust queueing system or running on Edge is needed.
    
    console.log('Triggering pipeline cycle from cron...');
    runPipelineCycle().catch(console.error);

    return NextResponse.json({ success: true, message: 'Pipeline triggered' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
