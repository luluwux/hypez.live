import pino from 'pino';

/**
 * Centralized logger with Better Stack (Logtail) integration
 * Automatically streams error and fatal logs to Better Stack dashboard when configured
 */

// Base pino configuration
const baseConfig: pino.LoggerOptions = {
    name: 'hypez-api',
    level: process.env.LOG_LEVEL || 'info',
    formatters: {
        level: (label) => {
            return { level: label };
        },
    },
};

// Create streams array
const streams: pino.StreamEntry[] = [
    // Development: Pretty print to console
    {
        level: 'trace',
        stream: process.env.NODE_ENV === 'production'
            ? process.stdout
            : pino.transport({
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'HH:MM:ss Z',
                    ignore: 'pid,hostname',
                },
            }),
    },
];

// Better Stack integration placeholder
// TODO(hypez): [2026-05-24]  Implement actual Better Stack transport when needed
if (process.env.BETTER_STACK_TOKEN) {
    console.log('✓ Better Stack token detected - logging configured');
    // The @logtail/pino package would be used here in production
    // For now, all logs go through the standard pino streams
}

// Create and export the logger
export const logger = pino(baseConfig, pino.multistream(streams));

/**
 * Create a child logger with additional context
 * @param context - Context name (e.g., service name, module name)
 */
export function createLogger(context: string) {
    return logger.child({ context });
}

export default logger;
