import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsArray, MaxLength, Matches } from 'class-validator';

/**
 * Known-safe social platforms. Non-whitelisted HTTPS domains are also accepted
 * as long as they are not private/internal network addresses.
 */
export const ALLOWED_SOCIAL_DOMAINS = [
    'twitter.com', 'x.com',
    'instagram.com',
    'youtube.com',
    'twitch.tv',
    'github.com',
    'linkedin.com',
    'tiktok.com',
    'telegram.me', 't.me',
    'spotify.com',
    'reddit.com',
    'steamcommunity.com',
    'kick.com',
    'discord.com',
] as const;

/**
 * Blocks:
 *  - Non-https protocols (javascript:, file:, http:, etc.)
 *  - localhost (with or without port)
 *  - Private IPv4 ranges: 0.x, 10.x, 127.x, 169.254.x, 172.16-31.x, 192.168.x
 *  - Any bare IPv4 literal (e.g. https://1.2.3.4)
 *  - IPv6 bracket notation (e.g. https://[::1])
 */
const SAFE_SOCIAL_URL_RE =
    /^https:\/\/(?!localhost(?::\d+)?(?:[:/]|$)|(?:0|10|127)\.\d|192\.168\.\d|172\.(?:1[6-9]|2\d|3[01])\.\d|169\.254\.\d|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?:[:/]|$)|\[).+/i;

export class UpdateProfileDto {
    @ApiProperty({ required: false, nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(100, { message: 'Occupation must not exceed 100 characters' })
    occupation?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(50, { message: 'Gender must not exceed 50 characters' })
    gender?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(100, { message: 'Location must not exceed 100 characters' })
    location?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @IsOptional()
    @IsDateString()
    birthday?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(500, { message: 'About must not exceed 500 characters' })
    about?: string | null;

    @ApiProperty({
        required: false,
        nullable: true,
        type: [String],
        description: `Social links — must be https://. Whitelisted platforms: ${ALLOWED_SOCIAL_DOMAINS.join(', ')}. Non-whitelisted public domains also accepted.`,
    })
    @IsOptional()
    @IsArray()
    @Matches(SAFE_SOCIAL_URL_RE, {
        each: true,
        message:
            'Her sosyal bağlantı https:// ile başlamalıdır. Özel IP adresleri (localhost, 127.x, 10.x, 192.168.x, vb.) ve javascript: URL\'leri yasaktır.',
    })
    socialLinks?: string[] | null;
}
