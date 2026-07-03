import { ApiProperty } from '@nestjs/swagger';

/**
 * Summary DTO for server list views
 * Excludes heavy relations (emojis, stickers) for performance
 */
export class ServerSummaryDto {
    @ApiProperty({ description: 'Server ID' })
    id: string;

    @ApiProperty({ description: 'Server name' })
    name: string;

    @ApiProperty({ description: 'Server description', required: false })
    description?: string;

    @ApiProperty({ description: 'Icon URL', required: false })
    icon?: string;

    @ApiProperty({ description: 'Banner URL', required: false })
    banner?: string;

    @ApiProperty({ description: 'Member count' })
    memberCount: number;

    @ApiProperty({ description: 'Active member count' })
    activeMemberCount: number;

    @ApiProperty({ description: 'Vote count' })
    votes: number;

    @ApiProperty({ description: 'Categories', type: [String] })
    categories: string[];

    @ApiProperty({ description: 'Premium tier', enum: ['NONE', 'PREMIUM'] })
    premiumTier: string;

    @ApiProperty({ description: 'Is premium' })
    isPremium: boolean;

    @ApiProperty({ description: 'Channel count' })
    channelCount: number;

    @ApiProperty({ description: 'Role count' })
    roleCount: number;

    @ApiProperty({ description: 'Emoji count (number only)' })
    emojiCount: number;

    @ApiProperty({ description: 'Sticker count (number only)' })
    stickerCount: number;

    @ApiProperty({ description: 'Boost count' })
    boostCount: number;

    @ApiProperty({ description: 'Voice member count' })
    voiceMemberCount: number;

    @ApiProperty({ description: 'Streaming member count' })
    streamingMemberCount: number;

    @ApiProperty({ description: 'Video member count' })
    videoMemberCount: number;

    @ApiProperty({ description: 'Normal voice member count' })
    normalVoiceMemberCount: number;

    @ApiProperty({ description: 'Created at' })
    createdAt: Date;
}
