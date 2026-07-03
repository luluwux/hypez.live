import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { Prisma } from '@prisma/client';
import { VoteService } from '../votes/vote.service.js';
import { LeaderboardService } from '../servers/leaderboard.service.js';
// TODO(hypez): [2026-05-24]  Run `npm run db:generate` to regenerate Prisma client so these can be
// imported directly from '@prisma/client'. Until then, literals are used.
const VerificationMode = { VISUAL: 'VISUAL', LOGIC: 'LOGIC', IDENTITY: 'IDENTITY' } as const;
const VerificationStatus = { PENDING: 'PENDING', VERIFIED: 'VERIFIED', EXPIRED: 'EXPIRED' } as const;
type VerificationMode = (typeof VerificationMode)[keyof typeof VerificationMode];
type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];
import { MathCaptchaService } from './math-captcha.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CAPTCHA_TTL_MS } from '../../common/constants/index.js';

@Injectable()
export class VerificationService {
    constructor(
        private prisma: PrismaService,
        private mathCaptchaService: MathCaptchaService,
        private voteService: VoteService,
        private leaderboardService: LeaderboardService,
        @InjectQueue('leaderboard-update') private leaderboardQueue: Queue
    ) { }

    async createSession(userId: string, serverId: string, userCreatedTimestamp?: string) {
        const { mode, challengeData } = this.generateChallengeData();

        const session = await this.prisma.verificationSession.create({
            data: {
                userId,
                serverId,
                mode,
                challengeData: challengeData as Prisma.InputJsonValue,
                status: VerificationStatus.PENDING,
                expiresAt: new Date(Date.now() + CAPTCHA_TTL_MS),
            },
        });

        return {
            sessionId: session.id,
            mode: session.mode,
            status: session.status,
            challenge: challengeData,
            url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${session.id}`,
        };
    }

    private generateChallengeData(): { mode: VerificationMode; challengeData: Record<string, unknown> } {
        const rand = Math.random();
        if (rand < 0.4) {
            return this.generateMathChallenge();
        } else if (rand < 0.7) {
            return this.generateEmojiChallenge();
        } else {
            return this.generateColorChallenge();
        }
    }

    private generateMathChallenge(): { mode: VerificationMode; challengeData: Record<string, unknown> } {
        const captcha = this.mathCaptchaService.generate();
        return {
            mode: VerificationMode.VISUAL,
            challengeData: {
                type: 'MATH_IMAGE',
                question: 'Solve the equation shown in the image',
                answer: captcha.answer.toString(),
                options: captcha.options,
                imageBase64: captcha.imageBuffer.toString('base64'),
            },
        };
    }

    private generateEmojiChallenge(): { mode: VerificationMode; challengeData: Record<string, unknown> } {
        const emojiSets = [
            { category: 'Fruit', correct: '🍎', options: ['🚗', '🍎', '⚽', '🎸', '🏢'] },
            { category: 'Vehicle', correct: '🚗', options: ['🍎', '🚗', '⚽', '🎸', '🏢'] },
            { category: 'Sport', correct: '⚽', options: ['🍎', '🚗', '⚽', '🎸', '🏢'] }
        ];
        const set = emojiSets[Math.floor(Math.random() * emojiSets.length)];
        const shuffled = set.options.sort(() => Math.random() - 0.5);

        return {
            mode: VerificationMode.LOGIC,
            challengeData: {
                type: 'EMOJI',
                question: `Click the ${set.category} emoji`,
                answer: set.correct,
                options: shuffled,
            },
        };
    }

    private generateColorChallenge(): { mode: VerificationMode; challengeData: Record<string, unknown> } {
        const colors = [
            { name: 'BLUE', hex: 'Primary', emoji: '🔵' },
            { name: 'RED', hex: 'Danger', emoji: '🔴' },
            { name: 'GREEN', hex: 'Success', emoji: '🟢' },
            { name: 'GRAY', hex: 'Secondary', emoji: '⚫' }
        ];
        const target = colors[Math.floor(Math.random() * colors.length)];

        return {
            mode: VerificationMode.LOGIC,
            challengeData: {
                type: 'COLOR',
                question: `Click the ${target.name} button!`,
                answer: target.name,
                options: colors.map(c => c.name),
            },
        };
    }

    async getSession(id: string) {
        return this.prisma.verificationSession.findUnique({
            where: { id },
        });
    }

    async verifySession(id: string, answer: string) {
        const session = await this.prisma.verificationSession.findUnique({ where: { id } });
        if (!session) throw new Error('Session not found');
        if (session.status !== 'PENDING') throw new Error('Session already processed');
        if (session.expiresAt < new Date()) {
            await this.prisma.verificationSession.update({ where: { id }, data: { status: VerificationStatus.EXPIRED } });
            throw new Error('Session expired');
        }

        let isValid = false;
        interface ChallengeData {
            type: string;
            question: string;
            answer: string;
            options: string[];
            imageBase64?: string;
        }
        const challenge = session.challengeData as unknown as ChallengeData;

        if (challenge.type === 'MATH_IMAGE') {
            if (parseInt(answer) === parseInt(challenge.answer)) isValid = true;
        } else if (challenge.type === 'EMOJI') {
            if (answer === challenge.answer) isValid = true;
        } else if (challenge.type === 'COLOR') {
            if (answer === challenge.answer) isValid = true;
        } else {
            if (answer == challenge.answer) isValid = true;
        }

        if (isValid) {
            await this.prisma.verificationSession.update({
                where: { id },
                data: { status: VerificationStatus.VERIFIED }
            });

            const voteResult = await this.voteService.vote(session.serverId, session.userId);

            this.leaderboardService.updateVoteRank(session.serverId, voteResult.server.votes).catch(
                err => console.error('[Leaderboard] Redis vote rank update failed:', err),
            );

            // Debounce Queue (Image Generation) — 5 dk sonra tam leaderboard güncellemesi
            const jobId = `leaderboard-${session.serverId}`;
            const existingJob = await this.leaderboardQueue.getJob(jobId);
            if (existingJob) {
                await existingJob.remove();
            }

            await this.leaderboardQueue.add('update-image', {
                guildId: session.serverId
            }, {
                jobId: jobId,
                delay: 5 * 60 * 1000,
                removeOnComplete: true
            });

            return { success: true, server: voteResult.server };
        } else {
            throw new Error('Incorrect answer');
        }
    }
}
