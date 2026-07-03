// DTO for bot-to-API server sync — includes all metadata + emoji/sticker arrays
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray, ValidateNested, Matches, IsNumber, IsInt, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class SyncEmojiDto {
    @IsString() @IsNotEmpty()
    @Matches(/^\d{17,20}$/, { message: 'emojiId must be a valid Discord snowflake ID' })
    emojiId: string;

    @IsString()
    name: string;

    @Matches(/^https?:\/\/.+$/, { message: 'Must be a valid URL starting with http or https' })
    url: string;

    @IsBoolean()
    @IsOptional()
    animated?: boolean;
}

export class SyncStickerDto {
    @IsString() @IsNotEmpty()
    @Matches(/^\d{17,20}$/, { message: 'stickerId must be a valid Discord snowflake ID' })
    stickerId: string;

    @IsString()
    name: string;

    @Matches(/^https?:\/\/.+$/, { message: 'Must be a valid URL starting with http or https' })
    url: string;

    @IsString()
    format: string;
}

export class SyncServerDto {
    @IsString() @IsNotEmpty()
    @Matches(/^\d{17,20}$/, { message: 'id must be a valid Discord snowflake ID' })
    id: string;

    @IsString() @IsNotEmpty()
    name: string;

    @IsOptional()
    @Matches(/^https?:\/\/.+$/, { message: 'Must be a valid URL starting with http or https' })
    icon?: string;

    @IsOptional()
    @Matches(/^https?:\/\/.+$/, { message: 'Must be a valid URL starting with http or https' })
    banner?: string;

    @IsString() @IsOptional()
    description?: string;

    @IsString() @IsOptional()
    @Matches(/^\d{17,20}$/, { message: 'ownerId must be a valid Discord snowflake ID' })
    ownerId?: string;

    @IsInt() @IsOptional()
    memberCount?: number;

    @IsInt() @IsOptional()
    activeMemberCount?: number;

    @IsInt() @IsOptional()
    channelCount?: number;

    @IsInt() @IsOptional()
    roleCount?: number;

    @IsInt() @IsOptional()
    emojiCount?: number;

    @IsInt() @IsOptional()
    stickerCount?: number;

    @IsInt() @IsOptional()
    boostCount?: number;

    @IsInt() @IsOptional()
    voiceMemberCount?: number;

    @IsInt() @IsOptional()
    streamingMemberCount?: number;

    @IsInt() @IsOptional()
    videoMemberCount?: number;

    @IsInt() @IsOptional()
    normalVoiceMemberCount?: number;

    @IsInt() @IsOptional()
    voiceChannelCount?: number;

    @IsOptional()
    @Matches(
        /^https:\/\/(discord\.gg|discord\.com\/invite)\/[a-zA-Z0-9-]+$/,
        { message: 'inviteUrl must be a valid Discord invite URL (discord.gg or discord.com/invite)' },
    )
    inviteUrl?: string | null;

    @IsArray() @IsOptional()
    badges?: string[];

    @IsString() @IsOptional()
    locale?: string;

    @IsArray() @IsOptional()
    categories?: string[];

    @IsArray() @IsOptional() @ValidateNested({ each: true }) @Type(() => SyncEmojiDto)
    emojis?: SyncEmojiDto[];

    @IsArray() @IsOptional() @ValidateNested({ each: true }) @Type(() => SyncStickerDto)
    stickers?: SyncStickerDto[];
}

export class BatchCounterDto {
    @IsString() @IsNotEmpty()
    @Matches(/^\d{17,20}$/, { message: 'serverId must be a valid Discord snowflake ID' })
    serverId: string;

    @IsInt() @IsOptional() version?: number;
    @IsInt() @IsOptional() memberCount?: number;
    @IsInt() @IsOptional() activeMemberCount?: number;
    @IsInt() @IsOptional() channelCount?: number;
    @IsInt() @IsOptional() roleCount?: number;
    @IsInt() @IsOptional() emojiCount?: number;
    @IsInt() @IsOptional() stickerCount?: number;
    @IsInt() @IsOptional() boostCount?: number;
    @IsInt() @IsOptional() voiceMemberCount?: number;
    @IsInt() @IsOptional() streamingMemberCount?: number;
    @IsInt() @IsOptional() videoMemberCount?: number;
    @IsInt() @IsOptional() normalVoiceMemberCount?: number;
    @IsInt() @IsOptional() voiceChannelCount?: number;
    @IsNumber() @IsOptional() updatedAt?: number;
}

export class SyncServersBatchDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SyncServerDto)
    servers: SyncServerDto[];
}

export class SyncCountersBatchDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BatchCounterDto)
    counters: BatchCounterDto[];
}

export class SyncEmojisBatchDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SyncEmojiDto)
    emojis: SyncEmojiDto[];
}

export class SyncStickersBatchDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SyncStickerDto)
    stickers: SyncStickerDto[];
}

export class BotVoteDto {
    @IsString()
    @IsNotEmpty()
    // Discord snowflakes are 17–20 digits; the original regex capped at 19 which would reject valid IDs
    @Matches(/^\d{17,20}$/, { message: 'userId must be a valid Discord snowflake ID' })
    userId: string;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    username?: string;

    @IsOptional()
    // Only allow Discord CDN URLs to prevent arbitrary URLs being stored in the database
    @Matches(/^https:\/\/(cdn\.discordapp\.com|media\.discordapp\.net)\/.+$/, {
        message: 'avatarUrl must be a Discord CDN URL',
    })
    avatarUrl?: string;
}
