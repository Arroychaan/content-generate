export class RateLimiter {
  constructor(delayMs = 4500) {
    this.delayMs = delayMs;
    this.lastRequestTime = 0;
  }

  async wait() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.delayMs) {
      const waitTime = this.delayMs - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }
}

// Global instance to coordinate across pipeline stages
export const globalRateLimiter = new RateLimiter(parseInt(process.env.RATE_LIMIT_DELAY_MS || '4500'));
