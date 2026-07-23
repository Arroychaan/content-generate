import { runPipelineCycle } from '../pipeline/PipelineCoordinator.js';
import { isSystemRunning } from '../services/system/SystemControlManager.js';

console.log('🤖 STARTING AUTONOMOUS AI WORKER...');
console.log(`Time: ${new Date().toISOString()}`);

async function runWorker() {
  const active = await isSystemRunning();
  if (!active) {
    console.log('🛑 SYSTEM IS STOPPED BY ADMIN. Worker will not run any agents.');
    process.exit(0);
  }

  console.log('🚀 SYSTEM IS RUNNING. Executing pipeline cycle...');
  try {
    await runPipelineCycle();
    console.log('✅ WORKER CYCLE COMPLETED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    console.error('❌ WORKER CYCLE FAILED:', error);
    process.exit(1);
  }
}

runWorker();
