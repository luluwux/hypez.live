import { IsNumber, Min, Max, IsOptional, IsString, IsBoolean, IsArray, IsDateString, IsEnum, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PremiumTier } from '@hypez/shared-types';

enum UserRole {
    USER = 'USER',
    ADMIN = 'ADMIN',
}

export class UpdateServerDto {
    @ApiPropertyOptional({ enum: PremiumTier })
    @IsOptional()
    @IsEnum(PremiumTier)
    premiumTier?: PremiumTier;

    @ApiPropertyOptional({ description: 'Premium expiry date (ISO 8601). Null = permanent.' })
    @IsOptional()
    @IsDateString()
    premiumExpiresAt?: string | null;

    @ApiPropertyOptional({ description: 'Whether the server is visible in the public listing' })
    @IsOptional()
    @IsBoolean()
    isVisible?: boolean;

    @ApiPropertyOptional({ description: 'Whether the server has the TOKEN badge' })
    @IsOptional()
    @IsBoolean()
    isToken?: boolean;

    @ApiPropertyOptional({ description: 'Whether the server is blacklisted' })
    @IsOptional()
    @IsBoolean()
    isBlacklisted?: boolean;

    @ApiPropertyOptional({ description: 'Reason for blacklisting the server' })
    @IsOptional()
    @IsString()
    blacklistReason?: string | null;

    @ApiPropertyOptional({ description: 'Server categories/tags' })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    categories?: string[];

    @ApiPropertyOptional({ description: 'Server description/about' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'Server badge slugs (e.g. verified, partner)' })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    badges?: string[];
}

export class UpdateUserDto {
    @ApiPropertyOptional({ description: 'Display name' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ description: 'Role: USER or ADMIN', enum: UserRole })
    @IsOptional()
    @IsEnum(UserRole)
    role?: string;

    @ApiPropertyOptional({ description: 'Badge slugs (e.g. verified, early_supporter)' })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    badges?: string[];

    @ApiPropertyOptional({ minimum: 0, maximum: 100 })
    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(100)
    trustScore?: number;

    @ApiPropertyOptional({ minimum: 0 })
    @IsOptional()
    @IsInt()
    @Min(0)
    premiumLevel?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isPublished?: boolean;

    @ApiPropertyOptional({ description: 'Audit reason (optional)' })
    @IsOptional()
    @IsString()
    reason?: string;
}

export class OverrideTrustScoreDto {
    @ApiProperty({ minimum: 0, maximum: 100 })
    @IsNumber()
    @Min(0)
    @Max(100)
    trustScore: number;

    @ApiProperty()
    @IsString()
    reason: string;
}

export class AddHypeDto {
    @ApiProperty({ description: 'Hype points to add (can be negative to remove)' })
    @IsNumber()
    points: number;
}
export class CreateTagDto {
    @ApiProperty({ description: 'Tag name' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ description: 'Hex color code' })
    @IsOptional()
    @IsString()
    color?: string;

    @ApiPropertyOptional({ description: 'Emoji icon' })
    @IsOptional()
    @IsString()
    emoji?: string;
}

export class UpdateTagDto {
    @ApiPropertyOptional({ description: 'Tag name' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ description: 'Hex color code' })
    @IsOptional()
    @IsString()
    color?: string;

    @ApiPropertyOptional({ description: 'Emoji icon' })
    @IsOptional()
    @IsString()
    emoji?: string;
}
export class CreateBadgeDto {
    @ApiProperty({ description: 'Badge name' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ description: 'Icon URL or emoji' })
    @IsOptional()
    @IsString()
    icon?: string;

    @ApiPropertyOptional({ description: 'Hex color code' })
    @IsOptional()
    @IsString()
    color?: string;

    @ApiPropertyOptional({ description: 'Badge description' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'Target type: USER or SERVER', default: 'USER' })
    @IsOptional()
    @IsString()
    targetType?: string;
}

export class UpdateBadgeDto {
    @ApiPropertyOptional({ description: 'Badge name' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ description: 'Icon URL or emoji' })
    @IsOptional()
    @IsString()
    icon?: string;

    @ApiPropertyOptional({ description: 'Hex color code' })
    @IsOptional()
    @IsString()
    color?: string;

    @ApiPropertyOptional({ description: 'Badge description' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'Target type: USER or SERVER' })
    @IsOptional()
    @IsString()
    targetType?: string;
}
export class CreateCategoryDto {
    @ApiProperty({ description: 'Category name' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ description: 'URL-friendly slug (auto-generated if not provided)' })
    @IsOptional()
    @IsString()
    slug?: string;

    @ApiPropertyOptional({ description: 'Emoji icon', default: '📁' })
    @IsOptional()
    @IsString()
    emoji?: string;

    @ApiPropertyOptional({ description: 'Hex color code', default: '#6366f1' })
    @IsOptional()
    @IsString()
    color?: string;

    @ApiPropertyOptional({ description: 'Sort order (lower = first)', default: 0 })
    @IsOptional()
    @IsNumber()
    sortOrder?: number;
}

export class UpdateCategoryDto {
    @ApiPropertyOptional({ description: 'Category name' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ description: 'URL-friendly slug' })
    @IsOptional()
    @IsString()
    slug?: string;

    @ApiPropertyOptional({ description: 'Emoji icon' })
    @IsOptional()
    @IsString()
    emoji?: string;

    @ApiPropertyOptional({ description: 'Hex color code' })
    @IsOptional()
    @IsString()
    color?: string;

    @ApiPropertyOptional({ description: 'Sort order' })
    @IsOptional()
    @IsNumber()
    sortOrder?: number;

    @ApiPropertyOptional({ description: 'Whether category is active' })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
export class UpdateBotSettingsDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    botName?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    prefix?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    token?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    autoStart?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    avatar?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    status?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    commandLogs?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    errorLogs?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    apiLogs?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    systemLogs?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    logLevel?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Min(1)
    logRetentionDays?: number;
}

export class CreateBotCommandDto {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsString()
    description: string;

    @ApiProperty()
    @IsString()
    category: string;

    @ApiProperty()
    @IsString()
    usage: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    cooldown?: string;
}

export class UpdateBotCommandDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    category?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    usage?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    cooldown?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class UpdateBotPermissionDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class CreatePremiumCodeDto {
    @ApiProperty({ description: 'Duration in days (e.g. 1, 7, 30)', minimum: 1 })
    @IsInt()
    @Min(1)
    duration: number;

    @ApiPropertyOptional({ description: 'Number of codes to generate', default: 1, minimum: 1, maximum: 100 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    count?: number;
}

