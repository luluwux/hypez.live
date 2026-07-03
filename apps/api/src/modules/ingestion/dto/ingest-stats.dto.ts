import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class IngestStatsDto {
    @ApiProperty({ description: 'The ID of the server', example: '123456789' })
    @IsString()
    @IsNotEmpty()
    serverId: string;

    @ApiProperty({ description: 'Total Member Count', example: 500 })
    @IsNumber()
    @IsNotEmpty()
    memberCount: number;

    @ApiProperty({ description: 'Active Member Count (Online/DND/Idle)', example: 120 })
    @IsNumber()
    @IsNotEmpty()
    activeMemberCount: number;

    @ApiProperty({ description: 'Number of voice users', example: 50 })
    @IsNumber()
    @IsOptional()
    voiceCount?: number;

    @ApiProperty({ description: 'Number of messages in the last interval', example: 120 })
    @IsNumber()
    @IsOptional()
    messageCount?: number;
}
