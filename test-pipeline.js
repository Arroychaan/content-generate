import { config } from 'dotenv';
config({ path: '.env.local' });

// We need to use dynamic imports for ES modules when testing in commonjs or node environment if it's not setup. 
// Actually, it's better to just write a simple runner using Next.js infrastructure or Babel/TS-node, but Next.js has next/jest or we can just compile and run.
// Let's create a quick script that uses dynamic import.

async function run() {
  console.log("Starting local pipeline test...");
  try {
    // Next.js uses turbopack/webpack, so running raw ES modules with Node might require node --experimental-modules or similar.
    // Let's just import the coordinator.
    const { runPipelineCycle } = await import('./src/pipeline/PipelineCoordinator.js');
    await runPipelineCycle(1); // test with batch size 1
    console.log("Pipeline test finished successfully.");
  } catch (e) {
    console.error("Pipeline test failed:", e);
  }
}

run();
