import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, MaxLength, Matches } from 'class-validator';
import { Sanitize } from '../../../common/decorators/sanitize.decorator';

export class UserUpdateServerDto {
    @ApiProperty({
        description: 'Short description of the server (max 300 chars, XSS protected)',
        required: false,
        example: 'A friendly community for gamers and developers'
    })
    @IsOptional()
    @IsString()
    @MaxLength(300, { message: 'Description must not exceed 300 characters' })
    @Sanitize()
    description?: string;

    @ApiProperty({
        description: 'Detailed description of the server (max 2000 chars, XSS protected)',
        required: false,
        example: 'Welcome to our community! We offer...'
    })
    @IsOptional()
    @IsString()
    @MaxLength(2000, { message: 'Long description must not exceed 2000 characters' })
    @Sanitize()
    longDescription?: string;

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

    @ApiProperty({
        description: 'Discord invite link',
        required: false,
        example: 'https://discord.gg/inviteCode'
    })
    @IsOptional()
    @IsString()
    @Matches(/^(https?:\/\/)?(www\.)?(discord\.gg|discord(app)?\.com\/invite)\/[a-zA-Z0-9-]{2,32}\/?$/, {
        message: 'Lütfen geçerli bir Discord davet bağlantısı girin.'
    })
    inviteUrl?: string;

    @ApiProperty({
        description: 'Language of the server',
        required: false,
        example: 'tr'
    })
    @IsOptional()
    @IsString()
    locale?: string;
}
