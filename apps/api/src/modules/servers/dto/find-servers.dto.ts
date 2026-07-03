// Query DTO for listing servers with filtering, search, and sorting on top of pagination
import { IsOptional, IsString, IsBoolean, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';
import { ServerSortField } from '@hypez/shared-types';

export class FindServersDto extends PaginationDto {
    @ApiPropertyOptional({ description: 'Filter by category (uses categories[] array, supports multiple comma-separated)' })
    @IsOptional()
    @IsString()
    category?: string;

    @ApiPropertyOptional({ description: 'Search by server name' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'Include NSFW servers' })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: { value: string }) => value === 'true')
    nsfw?: boolean;

    @ApiPropertyOptional({ description: 'Filter premium servers only' })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: { value: string }) => value === 'true')
    isPremium?: boolean;

    @ApiPropertyOptional({ description: 'Filter by language/locale' })
    @IsOptional()
    @IsString()
    language?: string;

    @ApiPropertyOptional({ enum: ServerSortField, default: ServerSortField.VOTES })
    @IsOptional()
    @IsEnum(ServerSortField)
    sort?: ServerSortField;

    @ApiPropertyOptional({ description: 'Ignore premium server priority boost in sorting' })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: { value: string }) => value === 'true')
    ignorePremiumBoost?: boolean;
}
