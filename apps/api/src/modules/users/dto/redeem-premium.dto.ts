import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RedeemPremiumDto {
    @ApiProperty({ description: 'The premium code to redeem' })
    @IsString()
    @IsNotEmpty()
    code: string;

    @ApiProperty({ description: 'The server ID to apply the premium status to' })
    @IsString()
    @IsNotEmpty()
    serverId: string;
}
