import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CaptchaFactoryService, CaptchaTier } from './captcha-factory.service';
import { TrustScoreService } from './trust-score.service';
import { AnalyticsService } from './analytics.service';
import { VoteService } from '../votes/vote.service.js';
import { LeaderboardService } from '../servers/leaderboard.service.js';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { RequestUser } from '../../common/interfaces/request-user.interface.js';

// VerificationService artık kullanılmıyor — pool-tabanlı CaptchaFactory akışı aktif.

@ApiTags('Verification')
@Controller('verification')
export class VerificationController {
    constructor(
        private readonly captchaFactory: CaptchaFactoryService,
        private readonly trustScoreService: TrustScoreService,
        private readonly analyticsService: AnalyticsService,
        private readonly voteService: VoteService,
        private readonly leaderboardService: LeaderboardService,
    ) { }

    /**
     * Kullanıcının trust score'una göre uygun tier captcha üretir ve döner.
     * Public endpoint — oy atmaz, yalnızca captcha görseli servis eder.
     * Kimlik doğrulama varsa JWT'den userId alınır; yoksa NORMAL tier kullanılır.
     */
    @Public()
    @Post('captcha/request-challenge')
    @ApiOperation({ summary: 'Get a captcha challenge based on user trust score' })
    async requestChallenge(@CurrentUser() user?: RequestUser) {
        let tier = CaptchaTier.NORMAL;
        if (user?.userId) {
            try {
                const { score } = await this.trustScoreService.getScore(user.userId);
                if (score >= 70) {
                    tier = CaptchaTier.TRUSTED;
                } else if (score < 30) {
                    tier = CaptchaTier.CRITICAL;
                }
            } catch {
                // getScore başarısız olursa NORMAL ile devam et — graceful fallback
            }
        }

        const captchaStart = Date.now();
        const challenge = await this.captchaFactory.getChallenge(tier);
        const captchaTime = Date.now() - captchaStart;

        this.analyticsService.trackPerformance('captcha', captchaTime).catch(err =>
            console.error('[Analytics] Failed to track captcha performance:', err),
        );

        return {
            id: challenge.id,
            imageBase64: challenge.imageBuffer.toString('base64'),
            options: challenge.options,
            tier,
        };
    }

    /**
     * Sadece captcha cevabını doğrular — oy oluşturmaz.
     * Kimlik doğrulama zorunlu; userId JWT'den alınır (body'den değil).
     */
    @Post('captcha/validate-only')
    @Throttle({ short: { ttl: 300000, limit: 3 } })
    @ApiOperation({ summary: 'Validate a captcha answer without recording a vote (for Hype flow)' })
    async validateCaptchaOnly(
        @Body() body: { id: string; answer: string; tier?: string },
        @CurrentUser() user: RequestUser,
    ) {
        const isValid = this.captchaFactory.validate(body.id, body.answer);
        const tier = (body.tier as CaptchaTier) || CaptchaTier.NORMAL;

        if (!isValid) {
            this.analyticsService.trackFailedCaptcha(tier).catch(err =>
                console.error('[Analytics] trackFailedCaptcha failed:', err),
            );
            this.trustScoreService.updateScore(user.userId, -5).catch(err =>
                console.error('[TrustScore] Penalty failed:', err),
            );
            throw new HttpException('Incorrect Answer', HttpStatus.BAD_REQUEST);
        }

        return { valid: true };
    }

    /**
     * Captcha cevabını doğrular; doğruysa oy oluşturur ve trust score'u günceller.
     * Kimlik doğrulama zorunlu; userId JWT'den alınır (body'den değil).
     */
    @Post('captcha/validate')
    @Throttle({ short: { ttl: 300000, limit: 3 } })
    @ApiOperation({ summary: 'Validate a captcha answer and record the vote' })
    async validateCaptcha(
        @Body() body: { id: string; answer: string; guildId: string; tier?: string },
        @CurrentUser() user: RequestUser,
    ) {
        const isValid = this.captchaFactory.validate(body.id, body.answer);
        const tier = (body.tier as CaptchaTier) || CaptchaTier.NORMAL;

        if (!isValid) {
            this.analyticsService.trackFailedCaptcha(tier).catch(err =>
                console.error('[Analytics] trackFailedCaptcha failed:', err),
            );
            this.trustScoreService.updateScore(user.userId, -5).catch(err =>
                console.error('[TrustScore] Penalty failed:', err),
            );
            throw new HttpException('Incorrect Answer', HttpStatus.BAD_REQUEST);
        }

        try {
            const result = await this.voteService.vote(body.guildId, user.userId);

            this.leaderboardService.updateVoteRank(body.guildId, result.server.votes).catch(
                err => console.error('[Leaderboard] Redis vote rank update failed:', err),
            );
            this.analyticsService.trackVote(tier).catch(err =>
                console.error('[Analytics] trackVote failed:', err),
            );
            this.trustScoreService.updateScore(user.userId, 2).catch(err =>
                console.error('[TrustScore] Score update failed:', err),
            );

            return result;
        } catch (err) {
            if (err instanceof HttpException) throw err;
            console.error('Vote Creation Failed:', err);
            return { success: true, warning: 'Vote not counted due to error' };
        }
    }
}
