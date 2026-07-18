import { supabaseAdmin } from '../../lib/supabase';
import { callGroq } from './GroqClient.js';
import { sendTelegramNotification } from '../notification/TelegramNotifier';
import { globalRateLimiter } from './RateLimiter';

export async function generateTextWithRotation(prompt, model = 'llama-3.3-70b-versatile', maxTokens = 1000) {
  // Apply the 4.5s rate limit before processing to respect API rate limits
  await globalRateLimiter.wait();

  // Fetch ACTIVE keys ordered by LRU
  const { data: keys, error } = await supabaseAdmin
    .from('api_key_registry')
    .select('*')
    .eq('provider', 'groq')
    .eq('status', 'ACTIVE')
    .order('last_used_at', { ascending: true, nullsFirst: true });

  if (error) {
    console.error('Error fetching API keys:', error);
    throw new Error('Failed to fetch API keys from database');
  }

  if (!keys || keys.length === 0) {
    const errorMsg = 'CRITICAL: No active Groq keys found in database. All keys might be blocked or missing.';
    console.error(errorMsg);
    await sendTelegramNotification('LLM_ERROR', errorMsg);
    throw new Error(errorMsg);
  }

  // Iterate over available keys
  for (const keyRecord of keys) {
    try {
      const apiKey = keyRecord.api_key_encrypted; 
      
      const response = await callGroq(apiKey, prompt, model, maxTokens);
      
      // Update key metrics (last_used_at, usage count)
      await supabaseAdmin
        .from('api_key_registry')
        .update({
          last_used_at: new Date().toISOString(),
          daily_usage_count: keyRecord.daily_usage_count + 1
        })
        .eq('id', keyRecord.id);

      return response;

    } catch (apiError) {
      const errorMsg = apiError.message || '';
      if (errorMsg === 'QUOTA_EXCEEDED' || errorMsg.includes('429')) {
        console.warn(`Key ${keyRecord.id} Quota/Rate Limit Exceeded. Trying next key if available...`);
        continue; // Fallback to next key in loop without breaking pipeline
      } else if (errorMsg.includes('401') || errorMsg.includes('403') || errorMsg.toLowerCase().includes('unauthorized') || errorMsg.toLowerCase().includes('forbidden') || errorMsg.toLowerCase().includes('invalid api key')) {
        console.error(`Key ${keyRecord.id} appears to be BANNED or INVALID. Auto-disabling it...`);
        // Auto-disable the banned key so we don't try it again next time
        await supabaseAdmin
          .from('api_key_registry')
          .update({ status: 'BLOCKED' })
          .eq('id', keyRecord.id);
        continue; // Skip to the next key
      } else {
        throw apiError; // Other errors (e.g. network) should be handled by caller's exponential backoff
      }
    }
  }

  // If we reach here, all attempted active keys resulted in Quota Exceeded during this loop
  const exhaustedMsg = 'All attempted Groq keys hit rate limit during execution. Pipeline halted for this item.';
  console.error(exhaustedMsg);
  await sendTelegramNotification('LLM_EXHAUSTED', exhaustedMsg);
  throw new Error(exhaustedMsg);
}
