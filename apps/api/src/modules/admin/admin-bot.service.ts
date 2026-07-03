import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service.js';
import { Prisma } from '@prisma/client';
import { UpdateBotSettingsDto, CreateBotCommandDto, UpdateBotCommandDto, UpdateBotPermissionDto } from './dto/admin.dto.js';

@Injectable()
export class AdminBotService {
    private readonly logger = new Logger(AdminBotService.name);

    constructor(private readonly prisma: PrismaService) {}

    async getBotSettings() {
        let settings = await this.prisma.botSettings.findFirst();
        if (!settings) {
            settings = await this.prisma.botSettings.create({
                data: {
                    botName: 'Moderasyon Bot',
                    prefix: '!',
                    description: 'Sunucu moderasyonu ve güvenlik özellikleri sağlar',
                    token: '',
                    autoStart: true,
                    avatar: 'https://cdn.discordapp.com/embed/avatars/0.png',
                    status: 'ONLINE',
                    commandLogs: true,
                    errorLogs: true,
                    apiLogs: false,
                    systemLogs: true,
                    logLevel: 'INFO',
                    logRetentionDays: 30,
                },
            });
            await this.seedBotData();
        }
        return settings;
    }

    async updateBotSettings(dto: UpdateBotSettingsDto) {
        const settings = await this.getBotSettings();
        const updated = await this.prisma.botSettings.update({
            where: { id: settings.id },
            data: dto as any,
        });

        await this.prisma.botLog.create({
            data: {
                level: 'INFO',
                category: 'System',
                message: `Bot genel ayarları güncellendi: ${Object.keys(dto).join(', ')}`,
                user: 'SystemAdmin',
            },
        });

        return updated;
    }

    async getBotCommands(search?: string, category?: string) {
        const count = await this.prisma.botCommand.count();
        if (count === 0) {
            await this.seedBotData();
        }

        const where: Prisma.BotCommandWhereInput = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (category && category !== 'Tümü') {
            where.category = category;
        }

        return this.prisma.botCommand.findMany({
            where,
            orderBy: { name: 'asc' },
        });
    }

    async createBotCommand(dto: CreateBotCommandDto) {
        const created = await this.prisma.botCommand.create({
            data: {
                name: dto.name.startsWith('!') ? dto.name : `!${dto.name}`,
                description: dto.description,
                category: dto.category,
                usage: dto.usage,
                cooldown: dto.cooldown || 'Yok',
                isActive: true,
                useCount: Math.floor(Math.random() * 200) + 10,
            },
        });

        await this.prisma.botLog.create({
            data: {
                level: 'INFO',
                category: 'Command',
                message: `Yeni bot komutu oluşturuldu: ${created.name}`,
                user: 'SystemAdmin',
            },
        });

        return created;
    }

    async updateBotCommand(id: string, dto: UpdateBotCommandDto) {
        const updated = await this.prisma.botCommand.update({
            where: { id },
            data: dto as any,
        });

        await this.prisma.botLog.create({
            data: {
                level: 'INFO',
                category: 'Command',
                message: `Bot komutu güncellendi: ${updated.name} (Durum: ${updated.isActive ? 'Aktif' : 'Pasif'}, Cooldown: ${updated.cooldown})`,
                user: 'SystemAdmin',
            },
        });

        return updated;
    }

    async deleteBotCommand(id: string) {
        const command = await this.prisma.botCommand.delete({ where: { id } });

        await this.prisma.botLog.create({
            data: {
                level: 'WARN',
                category: 'Command',
                message: `Bot komutu silindi: ${command.name}`,
                user: 'SystemAdmin',
            },
        });

        return { success: true };
    }

    async getBotPermissions(category?: string) {
        const count = await this.prisma.botPermission.count();
        if (count === 0) {
            await this.seedBotData();
        }

        const where: Prisma.BotPermissionWhereInput = {};
        if (category && category !== 'Tümü') {
            where.category = category;
        }

        return this.prisma.botPermission.findMany({
            where,
            orderBy: { name: 'asc' },
        });
    }

    async updateBotPermission(id: string, dto: UpdateBotPermissionDto) {
        const updated = await this.prisma.botPermission.update({
            where: { id },
            data: { isActive: dto.isActive },
        });

        await this.prisma.botLog.create({
            data: {
                level: 'INFO',
                category: 'System',
                message: `Bot izin ayarı güncellendi: ${updated.key} -> ${updated.isActive ? 'Aktif' : 'Pasif'}`,
                user: 'SystemAdmin',
            },
        });

        return updated;
    }

    async getBotLogs(level?: string, category?: string) {
        const where: Prisma.BotLogWhereInput = {};
        if (level && level !== 'Tümü') {
            where.level = level;
        }
        if (category && category !== 'Tümü') {
            where.category = category;
        }

        const count = await this.prisma.botLog.count();
        if (count === 0) {
            await this.seedBotLogs();
        }

        return this.prisma.botLog.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            take: 100,
        });
    }

    async clearBotLogs() {
        await this.prisma.botLog.deleteMany();
        
        await this.prisma.botLog.create({
            data: {
                level: 'WARN',
                category: 'System',
                message: 'Bot log geçmişi bir yönetici tarafından temizlendi.',
                user: 'SystemAdmin',
            },
        });

        return { success: true };
    }

    async seedBotData() {
        const commandCount = await this.prisma.botCommand.count();
        if (commandCount === 0) {
            const defaultCommands = [
                { name: '!ban', description: 'Kullanıcıyı sunucudan yasaklar', category: 'Moderasyon', usage: '!ban @kullanıcı [sebep]', cooldown: '5s', useCount: 45 },
                { name: '!kick', description: 'Kullanıcıyı sunucudan atar', category: 'Moderasyon', usage: '!kick @kullanıcı [sebep]', cooldown: '3s', useCount: 23 },
                { name: '!play', description: 'Müzik çalar', category: 'Müzik', usage: '!play <şarkı adı/URL>', cooldown: '1s', useCount: 1234 },
                { name: '!help', description: 'Yardım menüsünü gösterir', category: 'Genel', usage: '!help [komut]', cooldown: 'Yok', useCount: 567 },
                { name: '!mute', description: 'Kullanıcıyı susturur', category: 'Moderasyon', usage: '!mute @kullanıcı [süre]', cooldown: '3s', useCount: 12 },
                { name: '!ping', description: 'Gecikme süresini ölçer', category: 'Genel', usage: '!ping', cooldown: 'Yok', useCount: 89 },
                { name: '!daily', description: 'Günlük ödülü talep eder', category: 'Ekonomi', usage: '!daily', cooldown: '24s', useCount: 412 },
            ];

            for (const cmd of defaultCommands) {
                await this.prisma.botCommand.create({ data: cmd });
            }
        }

        const permCount = await this.prisma.botPermission.count();
        if (permCount === 0) {
            const defaultPermissions = [
                { key: 'ADMINISTRATOR', name: 'Yönetici', description: 'Tüm izinleri verir (tehlikeli)', category: 'Kritik', isDangerous: true, isActive: false },
                { key: 'MANAGE_GUILD', name: 'Sunucuyu Yönet', description: 'Sunucu ayarlarını değiştirme', category: 'Yönetim', isDangerous: false, isActive: true },
                { key: 'MANAGE_ROLES', name: 'Rolleri Yönet', description: 'Rolleri oluşturma, düzenleme ve silme', category: 'Yönetim', isDangerous: true, isActive: true },
                { key: 'MANAGE_CHANNELS', name: 'Kanalları Yönet', description: 'Kanalları oluşturma ve silme', category: 'Yönetim', isDangerous: false, isActive: true },
                { key: 'BAN_MEMBERS', name: 'Üyeleri Yasakla', description: 'Üyeleri sunucudan uzaklaştırma', category: 'Moderasyon', isDangerous: true, isActive: true },
                { key: 'KICK_MEMBERS', name: 'Üyeleri At', description: 'Üyeleri sunucudan atma', category: 'Moderasyon', isDangerous: false, isActive: true },
                { key: 'SEND_MESSAGES', name: 'Mesaj Gönder', description: 'Metin kanallarına mesaj yazma', category: 'Temel', isDangerous: false, isActive: true },
                { key: 'VIEW_CHANNEL', name: 'Kanalları Görüntüle', description: 'Kanalları görme yetkisi', category: 'Temel', isDangerous: false, isActive: true },
                { key: 'CONNECT', name: 'Bağlan', description: 'Ses kanallarına katılma', category: 'Ses', isDangerous: false, isActive: true },
                { key: 'SPEAK', name: 'Konuş', description: 'Ses kanallarında konuşma', category: 'Ses', isDangerous: false, isActive: true },
            ];

            for (const perm of defaultPermissions) {
                await this.prisma.botPermission.create({ data: perm });
            }
        }
    }

    async seedBotLogs() {
        const defaultLogs = [
            { timestamp: new Date(Date.now() - 5000), level: 'INFO', category: 'System', message: 'Bot başarıyla başlatıldı', user: null },
            { timestamp: new Date(Date.now() - 10000), level: 'INFO', category: 'Command', message: 'Komut kullanıldı: !ban @user123', user: 'john_doe#1234' },
            { timestamp: new Date(Date.now() - 30000), level: 'WARN', category: 'System', message: 'Discord API gecikmesi tespit edildi: 180ms', user: null },
            { timestamp: new Date(Date.now() - 60000), level: 'ERROR', category: 'Error', message: 'Ses kanalına bağlanılamadı: Kanal dolu veya yetki yetersiz', user: 'music_fan#9999' },
            { timestamp: new Date(Date.now() - 120000), level: 'INFO', category: 'Command', message: 'Komut kullanıldı: !play Rammstein - Du Hast', user: 'rocker_guy#4321' },
            { timestamp: new Date(Date.now() - 180000), level: 'INFO', category: 'System', message: 'Veritabanı bağlantısı tazelendi', user: null },
        ];

        for (const log of defaultLogs) {
            await this.prisma.botLog.create({ data: log });
        }
    }
}
