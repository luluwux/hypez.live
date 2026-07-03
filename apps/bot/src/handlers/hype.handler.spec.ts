// Unit tests for bot handler pure business logic: hype formula, week-year, cooldown
import {
    getWeekYear,
    calculateHypePoints,
    getNextSundayMidnight,
} from './hype.handler';

describe('hype.handler pure functions', () => {
    describe('getWeekYear', () => {
        it('returns a string in ISO week-year format', () => {
            const result = getWeekYear();
            // e.g. "2025-W20"
            expect(result).toMatch(/^\d{4}-W\d{2}$/);
        });

        it('returns current year in the string', () => {
            const result = getWeekYear();
            const year = new Date().getFullYear().toString();
            expect(result.startsWith(year)).toBe(true);
        });
    });

    describe('calculateHypePoints', () => {
        it('returns more points for smaller servers', () => {
            const smallPoints = calculateHypePoints(100);
            const largePoints = calculateHypePoints(100000);
            expect(smallPoints).toBeGreaterThan(largePoints);
        });

        it('returns a positive number for zero members', () => {
            const points = calculateHypePoints(0);
            expect(points).toBeGreaterThan(0);
            expect(points).toBeLessThanOrEqual(100000);
        });

        it('returns consistent results for same input', () => {
            expect(calculateHypePoints(1000)).toBe(calculateHypePoints(1000));
        });

        it('handles negative member count safely (treats as 0)', () => {
            const negativePoints = calculateHypePoints(-10);
            const zeroPoints = calculateHypePoints(0);
            expect(negativePoints).toBe(zeroPoints);
        });

        // Formula verification: 100_000 / (sqrt(memberCount) + 1)
        it('matches expected formula output for known input', () => {
            // sqrt(100) = 10, 10 + 1 = 11, 100_000 / 11 ≈ 9091
            expect(calculateHypePoints(100)).toBe(Math.round(100000 / 11));
        });
    });

    describe('getNextSundayMidnight', () => {
        it('returns a Date in the future', () => {
            const result = getNextSundayMidnight();
            expect(result.getTime()).toBeGreaterThan(Date.now());
        });

        it('returns midnight UTC (00:00:00.000)', () => {
            const result = getNextSundayMidnight();
            expect(result.getUTCHours()).toBe(0);
            expect(result.getUTCMinutes()).toBe(0);
            expect(result.getUTCSeconds()).toBe(0);
        });

        it('returns Sunday (day 0 in UTC)', () => {
            const result = getNextSundayMidnight();
            expect(result.getUTCDay()).toBe(0);
        });

        it('is at most 7 days away', () => {
            const result = getNextSundayMidnight();
            const diffMs = result.getTime() - Date.now();
            expect(diffMs).toBeLessThan(7 * 24 * 60 * 60 * 1000);
        });
    });
});
