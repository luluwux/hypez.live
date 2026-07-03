import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';
import { PrismaClient } from '@prisma/client';
import { Command } from './command';
import fs from 'fs';
import path from 'path';
import { Event } from './event';

export class HypezClient extends Client {
    public commands: Collection<string, Command> = new Collection();
    public prisma: PrismaClient;

    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildPresences,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildEmojisAndStickers,
            ],
            partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
            rest: {
                timeout: 30000,
            },
        });

        // Veritabanı bağlantı havuzunu (connection pool) sınırla.
        // Her shard / worker için bağlantı sayısını düşürerek PG sınırlarını aşmasını önleriz.
        let databaseUrl = process.env.DATABASE_URL;
        if (databaseUrl) {
            try {
                const url = new URL(databaseUrl);
                // Örn: Shard veya worker başına max 5 connection
                url.searchParams.set('connection_limit', '5');
                url.searchParams.set('pool_timeout', '30');
                databaseUrl = url.toString();
            } catch (err) {
                console.warn('[Prisma] Invalid DATABASE_URL format, using as is.');
            }
        }

        this.prisma = new PrismaClient({
            datasources: {
                db: {
                    url: databaseUrl,
                },
            },
        });
    }

    public async loadCommands() {
        const commandsPath = path.join(__dirname, '../commands');
        if (!fs.existsSync(commandsPath)) return;

        const commandFolders = fs.readdirSync(commandsPath);
        for (const folder of commandFolders) {
            const folderPath = path.join(commandsPath, folder);
            if (!fs.lstatSync(folderPath).isDirectory()) continue;

            const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
            for (const file of commandFiles) {
                const filePath = path.join(folderPath, file);
                const commandModule = await import(filePath) as { default: Command };
                const command: Command = commandModule.default;

                if (command && command.name) {
                    this.commands.set(command.name, command);
                    console.log(`[Command] Loaded ${command.name}`);
                }
            }
        }
    }

    public async loadEvents() {
        const eventsPath = path.join(__dirname, '../events');
        if (!fs.existsSync(eventsPath)) return;

        const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
        for (const file of eventFiles) {
            const filePath = path.join(eventsPath, file);
            const eventModule = await import(filePath) as { default: Event<any> };
            const event = eventModule.default;

            if (event.name) {
                if (event.once) {
                    this.once(event.name, (...args) => event.execute(this, ...args));
                } else {
                    this.on(event.name, (...args) => event.execute(this, ...args));
                }
                console.log(`[Event] Loaded ${event.name}`);
            }
        }
    }

    public async registerCommands() {
        // Basic registration logic for development (guild only) or global
        const commandsData = this.commands.map(cmd => ({
            name: cmd.name,
            description: cmd.description,
            options: cmd.options
        }));

        if (process.env.GUILD_ID) {
            const guild = this.guilds.cache.get(process.env.GUILD_ID);
            if (guild) {
                await guild.commands.set(commandsData);
                console.log(`Registered ${commandsData.length} commands to guild ${guild.name}`);
            }
        } else {
            await this.application?.commands.set(commandsData);
            console.log(`Registered ${commandsData.length} global commands`);
        }
    }

    public async start(token: string) {
        this.login(token);
    }
}
