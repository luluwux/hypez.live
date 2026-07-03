/**
 * Event Throttle Manager
 * Prevents high-frequency events from spamming the database
 * Max 1 update per guild per 60 seconds
 */

interface ThrottleEntry {
    lastUpdate: number;
    pending: boolean;
}

class EventThrottle {
    private throttleMap: Map<string, ThrottleEntry> = new Map();
    private readonly THROTTLE_MS = 60000; // 60 seconds
    private readonly MAX_ENTRIES = 1000; // Prevent memory leak

    /**
     * Check if an event should be processed
     * @param guildId - Discord guild ID
     * @param eventType - Type of event (e.g., 'memberAdd', 'voiceUpdate')
     * @returns true if event should be processed, false if throttled
     */
    shouldProcess(guildId: string, eventType: string): boolean {
        const key = `${guildId}:${eventType}`;
        const now = Date.now();
        const entry = this.throttleMap.get(key);

        if (!entry) {
            // Check if we need to force cleanup before adding
            if (this.throttleMap.size >= this.MAX_ENTRIES) {
                this.cleanup();
            }

            // First event for this guild/type
            this.throttleMap.set(key, { lastUpdate: now, pending: false });
            return true;
        }

        const timeSinceLastUpdate = now - entry.lastUpdate;

        if (timeSinceLastUpdate >= this.THROTTLE_MS) {
            // Throttle window passed, allow update
            entry.lastUpdate = now;
            entry.pending = false;
            return true;
        }

        // Within throttle window, mark as pending
        entry.pending = true;
        return false;
    }

    /**
     * Clean up old entries (run periodically to prevent memory leak)
     */
    cleanup(): void {
        const now = Date.now();
        const keysToDelete: string[] = [];

        for (const [key, entry] of this.throttleMap.entries()) {
            if (now - entry.lastUpdate > this.THROTTLE_MS * 2) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => this.throttleMap.delete(key));
    }
}

export const eventThrottle = new EventThrottle();

// Run cleanup every 5 minutes
setInterval(() => {
    eventThrottle.cleanup();
}, 300000);
