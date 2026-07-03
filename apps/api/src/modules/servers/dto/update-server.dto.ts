import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateServerDto, PremiumTier } from './create-server.dto';
import { IsOptional, IsEnum, IsDateString, IsNumber, IsBoolean, IsString } from 'class-validator';

export class UpdateServerDto extends PartialType(CreateServerDto) {
    // Admin / System Fields
    @ApiProperty({ enum: PremiumTier, required: false })
    @IsOptional()
    @IsEnum(PremiumTier)
    premiumTier?: PremiumTier;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    premiumExpiresAt?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    hypeModifier?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    isVisible?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    inviteUrl?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    leaderboardChannelId?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    leaderboardMessageId?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    locale?: string;

    @ApiProperty({ required: false, description: 'Server version for optimistic locking' })
    @IsOptional()
    @IsNumber()
    version?: number;
}
