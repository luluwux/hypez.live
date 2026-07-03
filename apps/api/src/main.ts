import { NestFactory, Reflector, HttpAdapterHost } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import { AppModule } from './app.module';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { apiReference } from '@scalar/nestjs-api-reference';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { SanitizePipe } from './common/pipes/sanitize.pipe';

async function bootstrap() {
    const requiredEnvVars = [
        'DATABASE_URL',
        'JWT_SECRET',
        'BOT_SECRET',
        'ADMIN_API_KEY',
        'REDIS_URL',
    ];

    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            throw new Error(`Missing required environment variable: ${envVar}`);
        }
    }

    // Enforce minimum secret strength — short or predictable secrets are exploitable
    const secretStrengthChecks: Array<[string, string]> = [
        ['JWT_SECRET', process.env.JWT_SECRET!],
        ['BOT_SECRET', process.env.BOT_SECRET!],
        ['ADMIN_API_KEY', process.env.ADMIN_API_KEY!],
    ];
    for (const [name, value] of secretStrengthChecks) {
        if (value.length < 32) {
            throw new Error(
                `${name} must be at least 32 characters. Generate one with: node -e "require('crypto').randomBytes(32).toString('hex')"`,
            );
        }
    }

    // AUTH_SECRET and JWT_SECRET must be different values — sharing them means a
    // leaked NextAuth session secret also compromises the backend API token.
    if (process.env.AUTH_SECRET && process.env.AUTH_SECRET === process.env.JWT_SECRET) {
        console.warn(
            '[SECURITY WARNING] AUTH_SECRET and JWT_SECRET are identical. ' +
            'Use separate values so that a compromise of one does not affect the other.',
        );
    }

    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    app.enableShutdownHooks();

    // Trust Cloudflare proxy for accurate IP-based rate limiting
    app.set('trust proxy', 1);

    // Root path handler to satisfy cloud load balancer health checks and clean up log spam
    app.use((req: any, res: any, next: any) => {
        if (req.path === '/' || req.path === '') {
            return res.status(200).json({
                name: 'Hypez API',
                status: 'operational',
                version: '1.0.0',
                docs: '/docs',
                health: '/api/health',
            });
        }
        next();
    });

    app.setGlobalPrefix('api');

    // Limit body size to prevent payload too large attacks
    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true, limit: '1mb' }));

    // CORS: lock down to known origins; extend via env var for production
    const corsOrigins = process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
        : ['https://hypez.live', 'https://www.hypez.live', 'https://status.hypez.live', 'https://hypez.net', 'https://www.hypez.net', 'http://localhost:3000'];

    app.enableCors({
        origin: corsOrigins,
        credentials: true,
    });

    // Helmet with a minimal CSP that allows the Scalar docs UI to function.
    // CSP is intentionally restrictive — add directives only as needed.
    app.use(
        helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    // Scalar loads its own fonts/scripts from CDN
                    scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", 'data:', 'cdn.discordapp.com', 'media.discordapp.net'],
                    connectSrc: ["'self'"],
                    fontSrc: ["'self'", 'data:'],
                    objectSrc: ["'none'"],
                    frameAncestors: ["'none'"],
                },
            },
            crossOriginEmbedderPolicy: false, // Required for Scalar docs iframe
        }),
    );

    app.useGlobalPipes(
        new SanitizePipe(),
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
        }),
    );

    app.useGlobalInterceptors(
        new ClassSerializerInterceptor(app.get(Reflector)),
        new TransformInterceptor(),
    );

    // Single unified exception filter: logs all errors and returns consistent JSON.
    // GlobalExceptionFilter was a duplicate with identical catch scope (@Catch()).
    // NestJS applies filters LIFO so having two @Catch() filters means the second
    // never fires — consolidating into AllExceptionsFilter resolves the ambiguity.
    const httpAdapterHost = app.get(HttpAdapterHost);
    app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost));

    if (process.env.NODE_ENV !== 'production') {
        const config = new DocumentBuilder()
            .setTitle('Hypez API')
            .setDescription('Discord Server List Backend')
            .setVersion('1.0')
            .addBearerAuth()
            .addApiKey({ type: 'apiKey', name: 'X-BOT-SECRET', in: 'header' }, 'bot-api-key')
            .addApiKey({ type: 'apiKey', name: 'X-ADMIN-KEY', in: 'header' }, 'admin-api-key')
            .build();

        const document = SwaggerModule.createDocument(app, config);

        app.use(
            '/docs',
            apiReference({
                spec: { content: document },
                theme: 'deepSpace',
                darkMode: true,
            } as Parameters<typeof apiReference>[0]),
        );
    }

    const server = await app.listen(3001, '0.0.0.0');

    console.log(`Application is running on: ${await app.getUrl()}/api`);
    console.log(`Docs are available at: ${await app.getUrl()}/docs`);

    const gracefulShutdown = async (signal: string) => {
        console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

        const forceKill = setTimeout(() => {
            console.error('🚨 Shutdown timed out! Force killing process.');
            process.exit(1);
        }, 5000);

        try {
            console.log('🔌 Closing HTTP Server...');
            server.close((err: Error | undefined) => {
                if (err) console.error('Error closing server:', err);
                else console.log('HTTP Server closed.');
            });
            await app.close();
            console.log('✅ App closed successfully.');
            clearTimeout(forceKill);
            process.exit(0);
        } catch (err) {
            console.error('❌ Error during shutdown:', err);
            process.exit(1);
        }
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

bootstrap();