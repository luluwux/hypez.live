class CircuitBreaker {
  private errors = 0;
  private lastError = 0;
  private readonly threshold = 5;
  private readonly timeout = 30_000;

  isOpen(): boolean {
    if (this.errors >= this.threshold) {
      if (Date.now() - this.lastError < this.timeout) return true;
      this.reset();
    }
    return false;
  }

  recordError() {
    this.errors++;
    this.lastError = Date.now();
  }

  reset() {
    this.errors = 0;
  }
}

export const discordBreaker = new CircuitBreaker();

export async function withDiscordCircuitBreaker<T>(operation: () => Promise<T>): Promise<T | undefined> {
  if (discordBreaker.isOpen()) {
    console.warn('[Bot] Circuit breaker açık, işlem atlandı');
    return undefined;
  }
  try {
    const result = await operation();
    discordBreaker.reset();
    return result;
  } catch (err) {
    discordBreaker.recordError();
    throw err;
  }
}
