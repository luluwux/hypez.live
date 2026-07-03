import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateSystemSettingsDto {
    @IsOptional()
    @IsString()
    siteName?: string;

    @IsOptional()
    @IsString()
    siteUrl?: string;

    @IsOptional()
    @IsString()
    siteDescription?: string;

    @IsOptional()
    @IsString()
    adminEmail?: string;

    @IsOptional()
    @IsString()
    supportEmail?: string;

    @IsOptional()
    @IsString()
    defaultLanguage?: string;

    @IsOptional()
    @IsString()
    timezone?: string;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsOptional()
    @IsBoolean()
    maintenanceMode?: boolean;
}
