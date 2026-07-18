import { supabaseAdmin } from '../../lib/supabase';
import { callGemini } from './GeminiClient';
import { callGroq } from './GroqClient.js';
import { sendTelegramNotification } from '../notification/TelegramNotifier';
import { globalRateLimiter } from './RateLimiter';

export async function generateTextWithRotation(prompt, model = 'gemini-3.5-flash', maxTokens = 1000) {
  // Apply the 4.5s rate limit before processing
  await globalRateLimiter.wait();

  // Fetch ACTIVE keys ordered by LRU
  const { data: keys, error } = await supabaseAdmin
    .from('api_key_registry')
    .select('*')
    .eq('provider', 'gemini')
    .eq('status', 'ACTIVE')
    .order('last_used_at', { ascending: true, nullsFirst: true });

  if (error) {
    console.error('Error fetching API keys:', error);
    throw new Error('Failed to fetch API keys from database');
  }

  if (!keys || keys.length === 0) {
    console.warn('All Gemini keys are blocked or none exist. Falling back to Groq.');
    await sendTelegramNotification('LLM_FALLBACK', 'All Gemini keys blocked, using Groq fallback.');
    return await callGroq(prompt, maxTokens);
  }

  // Iterate over available keys
  for (const keyRecord of keys) {
    try {
      const apiKey = keyRecord.api_key_encrypted; // Assuming simple decryption or raw key storage for this MVP
      
      const response = await callGemini(apiKey, prompt, model, maxTokens);
      
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
      if (apiError.message === 'QUOTA_EXCEEDED') {
        // Block key until next day
        const tomorrow = new Date();
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        tomorrow.setUTCHours(0, 0, 0, 0);

        await supabaseAdmin
          .from('api_key_registry')
          .update({
            status: 'BLOCKED',
            blocked_until: tomorrow.toISOString()
          })
          .eq('id', keyRecord.id);
        
        console.warn(`Key ${keyRecord.id} Quota Exceeded. Blocked until ${tomorrow.toISOString()}`);
        continue; // Fallback to next key in loop without breaking pipeline
      } else {
        throw apiError; // Other errors (e.g. network) should be handled by caller's exponential backoff
      }
    }
  }

  // If we reach here, all attempted active keys resulted in Quota Exceeded during this loop
  console.warn('All attempted Gemini keys hit limit during execution. Falling back to Groq.');
  await sendTelegramNotification('LLM_FALLBACK', 'Hit limits on all Gemini keys during loop, fallback to Groq.');
  return await callGroq(prompt, maxTokens);
}
