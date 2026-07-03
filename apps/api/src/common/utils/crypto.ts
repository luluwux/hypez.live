import * as crypto from 'crypto';

/**
 * Performs a timing-safe comparison of two strings.
 * Hashes both inputs using SHA-256 before comparing to prevent length disclosure
 * and allow comparison of values with different lengths.
 */
export function safeCompare(a: string, b: string): boolean {
    if (typeof a !== 'string' || typeof b !== 'string') {
        return false;
    }
    const aHash = crypto.createHash('sha256').update(a).digest();
    const bHash = crypto.createHash('sha256').update(b).digest();
    return crypto.timingSafeEqual(aHash, bHash);
}
