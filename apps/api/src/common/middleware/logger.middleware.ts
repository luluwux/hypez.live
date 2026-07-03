import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger';

const logger = createLogger('HTTP');

/**
 * Request logging middleware
 * Logs every incoming HTTP request with method, path, status code, and processing time
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        const startTime = Date.now();
        const { method, originalUrl, ip } = req;

        // Log when response finishes
        res.on('finish', () => {
            const duration = Date.now() - startTime;
            const { statusCode } = res;

            // Determine log level based on status code
            const logLevel =
                statusCode >= 500
                    ? 'error'
                    : statusCode >= 400
                        ? 'warn'
                        : 'info';

            logger[logLevel]({
                method,
                path: originalUrl,
                statusCode,
                duration,
                ip,
                userAgent: req.get('user-agent') || 'unknown',
            }, `${method} ${originalUrl} ${statusCode} - ${duration}ms`);
        });

        next();
    }
}
