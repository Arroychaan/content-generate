import { sendTelegramNotification } from '../notification/TelegramNotifier';

const MAX_RETRIES = 3;
const BASE_DELAY = 5000; // 5 seconds
const MULTIPLIER = 5; // 5s -> 25s -> 125s

export async function withExponentialBackoff(asyncFn) {
  let attempt = 0;
  let currentDelay = BASE_DELAY;

  while (attempt < MAX_RETRIES) {
    try {
      return await asyncFn();
    } catch (error) {
      attempt++;
      console.error(`Attempt ${attempt} failed: ${error.message}`);
      
      if (attempt >= MAX_RETRIES) {
        // Fatal failure after max retries
        await sendTelegramNotification(
          'FATAL_ERROR_AFTER_RETRIES',
          `Operation failed permanently after ${MAX_RETRIES} attempts.`,
          error.message
        );
        throw new Error(`Operation failed after ${MAX_RETRIES} retries. Original error: ${error.message}`);
      }

      console.log(`Waiting ${currentDelay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, currentDelay));
      currentDelay *= MULTIPLIER;
    }
  }
}
