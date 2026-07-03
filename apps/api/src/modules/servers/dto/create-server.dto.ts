import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray, IsEnum, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ServerCategory } from '../enums/server-category.enum';
import { Sanitize } from '../../../common/decorators/sanitize.decorator';

export enum PremiumTier {
    NONE = 'NONE',
    PREMIUM = 'PREMIUM',
}

export class CreateServerDto {
    @ApiProperty({ description: 'The Discord Server ID', example: '123456789012345678' })
    @IsString()
    @IsOptional()
    @Matches(/^\d{17,20}$/, { message: 'Server ID must be a valid Discord snowflake ID' })
    id?: string;

    @ApiProperty({ description: 'The name of the server', example: 'Lulushu Community' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'The owner ID of the server', example: '123456789' })
    @IsString()
    @IsNotEmpty()
    @Matches(/^\d{17,20}$/, { message: 'Owner ID must be a valid Discord snowflake ID' })
    ownerId: string;

    @ApiProperty({ description: 'Server Icon URL', required: false, example: 'https://example.com/icon.png' })
    @IsString()
    @IsOptional()
    icon?: string;

    @ApiProperty({ description: 'Server Banner URL', required: false, example: 'https://example.com/banner.png' })
    @IsString()
    @IsOptional()
    banner?: string;

    @ApiProperty({
        description: 'Short description of the server (max 300 chars, XSS protected)',
        required: false,
        example: 'A friendly community for gamers and developers'
    })
    @IsString()
    @IsOptional()
    @MaxLength(300, { message: 'Description must not exceed 300 characters' })
    @Sanitize()
    description?: string;

    @ApiProperty({
        description: 'Detailed description of the server (max 2000 chars, XSS protected)',
        required: false,
        example: 'Welcome to our community! We offer...'
    })
    @IsString()
    @IsOptional()
    @MaxLength(2000, { message: 'Long description must not exceed 2000 characters' })
    @Sanitize()
    longDescription?: string;

    @ApiProperty({ description: 'Member count of the server', required: false, example: 100 })
    @IsOptional()
    memberCount?: number;

    @ApiProperty({ description: 'Active member count', required: false, example: 50 })
    @IsOptional()
    activeMemberCount?: number;

    @ApiProperty({ description: 'Voice member count', required: false, example: 10 })
    @IsOptional()
    voiceMemberCount?: number;

    @ApiProperty({ description: 'Streaming member count', required: false, example: 2 })
    @IsOptional()
    streamingMemberCount?: number;

    @ApiProperty({ description: 'Video member count', required: false, example: 1 })
    @IsOptional()
    videoMemberCount?: number;

    @ApiProperty({ description: 'Normal voice member count', required: false, example: 7 })
    @IsOptional()
    normalVoiceMemberCount?: number;

    @ApiProperty({ description: 'Role count', required: false, example: 5 })
    @IsOptional()
    roleCount?: number;

    @ApiProperty({ description: 'Emoji count', required: false, example: 10 })
    @IsOptional()
    emojiCount?: number;

    @ApiProperty({ description: 'Sticker count', required: false, example: 2 })
    @IsOptional()
    stickerCount?: number;

    @ApiProperty({ description: 'Boost count', required: false, example: 2 })
    @IsOptional()
    boostCount?: number;

    @ApiProperty({
        description: 'Primary category of the server',
        enum: ServerCategory,
        example: ServerCategory.COMMUNITY,
        required: false,
    })
    @IsOptional()
    @IsEnum(ServerCategory)
    category?: ServerCategory;

    @ApiProperty({
        description: 'List of categories',
        type: [String],
        required: false,
        example: ['gaming', 'anime']
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    categories?: string[];
}
