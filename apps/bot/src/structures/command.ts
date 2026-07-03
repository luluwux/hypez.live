import {
    ChatInputCommandInteraction,
    PermissionsBitField,
    SlashCommandBuilder,
    Client,
    ApplicationCommandOptionData,
} from 'discord.js';
import { HypezClient } from './client';

export interface CommandOptions {
    name: string;
    description: string;
    category?: string;
    options?: ApplicationCommandOptionData[];
    execute: (client: HypezClient, interaction: ChatInputCommandInteraction) => Promise<unknown>;
}

export class Command {
    public name: string;
    public description: string;
    public category?: string;
    public options?: ApplicationCommandOptionData[];
    public execute: (client: HypezClient, interaction: ChatInputCommandInteraction) => Promise<unknown>;

    constructor(options: CommandOptions) {
        this.name = options.name;
        this.description = options.description;
        this.category = options.category;
        this.options = options.options;
        this.execute = options.execute;
    }
}
