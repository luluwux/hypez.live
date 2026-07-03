import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    constructor(private readonly httpAdapterHost: HttpAdapterHost) { }

    catch(exception: unknown, host: ArgumentsHost): void {
        const logMessage = exception instanceof Error ? exception.message : String(exception);
        console.error('[AllExceptionsFilter]', logMessage);
        const { httpAdapter } = this.httpAdapterHost;

        const ctx = host.switchToHttp();

        const httpStatus =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const message =
            exception instanceof HttpException
                ? exception.getResponse()
                : 'Internal server error';

        // Extract message string if it's an object (common in NestJS validation errors)
        const errorMessage =
            typeof message === 'object' && message !== null && 'message' in message
                ? (message as { message?: unknown }).message
                : message;

        const responseBody = {
            success: false,
            statusCode: httpStatus,
            message: Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage,
            timestamp: new Date().toISOString(),
            path: httpAdapter.getRequestUrl(ctx.getRequest()),
        };

        httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
    }
}
