export const messageCounter = new Map<string, number>();

export function incrementMessageCount(guildId: string) {
    const current = messageCounter.get(guildId) || 0;
    messageCounter.set(guildId, current + 1);
}

export function popMessageCount(guildId: string): number {
    const count = messageCounter.get(guildId) || 0;
    messageCounter.delete(guildId);
    return count;
}
