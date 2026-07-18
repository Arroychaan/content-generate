import { runPipelineCycle } from '../pipeline/PipelineCoordinator.js';

console.log('🤖 STARTING STANDALONE AI WORKER...');
console.log('Mode: GitHub Actions Dedicated Worker');
console.log(`Time: ${new Date().toISOString()}`);

// Jalankan pipeline secara mandiri tanpa Web Server
runPipelineCycle()
  .then(() => {
    console.log('✅ WORKER CYCLE COMPLETED SUCCESSFULLY!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ WORKER CYCLE FAILED:', error);
    process.exit(1);
  });
