import { withExponentialBackoff } from '../services/resilience/ExponentialBackoff';
import { generateTextWithRotation } from '../services/llm/TokenRotator';
import { supabaseAdmin } from '../lib/supabase';
import { sendTelegramNotification } from '../services/notification/TelegramNotifier';
import { checkNextContentType } from '../services/scheduling/ContentQueueManager';
import { isSystemRunning } from '../services/system/SystemControlManager';

// Import all 13 agents (mock implementation structure for now)
import * as IngestionWorker from '../agents/01_IngestionWorker';
import * as DeduplicationAgent from '../agents/02_DeduplicationAgent';
import * as QualityScoringAgent from '../agents/03_QualityScoringAgent';
import * as TopicSelector from '../agents/04_TopicSelector';
import * as DeepResearchInvestigator from '../agents/05_DeepResearchInvestigator';
import * as AngleIsolationAgent from '../agents/06_AngleIsolationAgent';
import * as JournalistCopywriter from '../agents/07_JournalistCopywriter';
import * as ImageStockRouter from '../agents/08_ImageStockRouter';
import * as LayoutCoordinatorAgent from '../agents/09_LayoutCoordinatorAgent';
import * as ProgrammaticRenderEngine from '../agents/10_ProgrammaticRenderEngine';
import * as AutonomousQASpecialist from '../agents/11_AutonomousQASpecialist';
import * as CrossPlatformAdapter from '../agents/12_CrossPlatformAdapter';
import * as StorageIngestionSync from '../agents/13_StorageIngestionSync';

export async function runPipelineCycle(batchSize = parseInt(process.env.BATCH_SIZE_PER_CYCLE || '3')) {
  try {
    // 🛑 Emergency Switch Check
    if (!(await isSystemRunning())) {
      console.log('🛑 System Status is STOPPED. No agents allowed to run!');
      await supabaseAdmin.from('system_activity_logs').insert([{
        event_type: 'PIPELINE_BLOCKED',
        message: '🛑 Execution blocked! System status is STOPPED (BERHENTI). No agents allowed to run.',
        agent_stage: 0
      }]);
      return;
    }

    console.log(`Starting pipeline cycle with batch size ${batchSize}...`);
    await supabaseAdmin.from('system_activity_logs').insert([{
      event_type: 'PIPELINE_START',
      message: `Starting pipeline cycle with batch size ${batchSize}...`,
      agent_stage: 0
    }]);
    
    // Stage 1: Ingestion
    if (!(await isSystemRunning())) return;
    const rawFeeds = await IngestionWorker.execute();
    
    // Stage 2: Deduplication
    if (!(await isSystemRunning())) return;
    const uniqueTopics = await DeduplicationAgent.execute(rawFeeds);
    
    // Stage 3: Quality Scoring
    if (!(await isSystemRunning())) return;
    const scoredTopics = await QualityScoringAgent.execute(uniqueTopics);
    
    // Stage 4: Topic Selection (filter out top N based on batchSize)
    if (!(await isSystemRunning())) return;
    const selectedTopics = await TopicSelector.execute(scoredTopics, batchSize);

    // Process each topic individually (Micro-batching)
    for (const topic of selectedTopics) {
      if (!(await isSystemRunning())) break;
      await processSingleTopic(topic);
    }

    console.log('Pipeline cycle completed successfully.');
    await supabaseAdmin.from('system_activity_logs').insert([{
      event_type: 'PIPELINE_SUCCESS',
      message: `Successfully processed ${selectedTopics.length} topics.`,
      agent_stage: 13
    }]);
  } catch (error) {
    console.error('Fatal Pipeline Error:', error);
    await sendTelegramNotification('PIPELINE_FATAL_ERROR', 'Entire pipeline cycle failed', error.message);
  }
}

async function processSingleTopic(topic) {
  if (!(await isSystemRunning())) {
    console.log(`🛑 System STOPPED. Skipping processSingleTopic for "${topic?.title}"`);
    return;
  }
  let currentStage = 5;
  try {
    const contentType = await checkNextContentType();
    let draftContext = { topic, contentType };

    // Stage 5: Deep Research
    draftContext.researchData = await DeepResearchInvestigator.execute(draftContext);
    currentStage++;

    // Stage 6: Angle Isolation
    draftContext.angle = await AngleIsolationAgent.execute(draftContext);
    currentStage++;

    // Stage 7: Journalist Copywriter (Loop target for QA failures)
    let qaPassed = false;
    let retryCount = 0;
    const MAX_QA_RETRIES = 2;

    while (!qaPassed && retryCount <= MAX_QA_RETRIES) {
      draftContext.drafts = await JournalistCopywriter.execute(draftContext);
      currentStage = 8;
      
      if (contentType === 'IMAGE') {
        // Stage 8: Image Stock API Router
        draftContext.stockImage = await ImageStockRouter.execute(draftContext);
        currentStage++;

        // Stage 9: Layout Coordinator
        draftContext.layoutParams = await LayoutCoordinatorAgent.execute(draftContext);
        currentStage++;

        // Stage 10: Programmatic Render
        draftContext.renderedImageBuffer = await ProgrammaticRenderEngine.execute(draftContext);
        currentStage++;
      } else {
        currentStage = 11; // Skip image rendering for text-only
      }

      // Stage 11: Autonomous QA Specialist
      const qaResult = await AutonomousQASpecialist.execute(draftContext);
      
      if (qaResult.passed) {
        qaPassed = true;
      } else {
        retryCount++;
        console.warn(`QA Failed for topic ${topic.title}. Retrying... (${retryCount}/${MAX_QA_RETRIES})`);
        draftContext.qaFeedback = qaResult.feedback;
        currentStage = 7; // Loop back
      }
    }

    if (!qaPassed) {
      throw new Error('QA Failed permanently after max retries.');
    }

    currentStage = 12;
    // Stage 12: Cross-Platform Adapter (Deep Threads generation, etc)
    if (contentType === 'TEXT_ONLY') {
      draftContext.platformVariants = await CrossPlatformAdapter.execute(draftContext);
    } else {
      draftContext.platformVariants = {};
    }
    
    currentStage = 13;
    // Stage 13: Storage & Ingestion Sync
    await StorageIngestionSync.execute(draftContext);

    await supabaseAdmin.from('system_activity_logs').insert([{
      event_type: 'TOPIC_SUCCESS',
      message: `Successfully generated content for: ${topic.title}`,
      agent_stage: 13
    }]);

  } catch (error) {
    console.error(`Error processing topic at stage ${currentStage}:`, error);
    // Log to Supabase system_activity_logs
    await supabaseAdmin.from('system_activity_logs').insert([{
      event_type: 'AGENT_ERROR',
      agent_stage: currentStage,
      message: `Failed to process topic: ${topic?.title}`,
      metadata: { error: error.message, stack: error.stack }
    }]);
  }
}
