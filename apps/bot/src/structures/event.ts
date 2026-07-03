import { ClientEvents } from 'discord.js';
import { HypezClient } from './client';

export interface EventOptions<K extends keyof ClientEvents> {
    name: K;
    once?: boolean;
    execute: (client: HypezClient, ...args: ClientEvents[K]) => Promise<unknown> | unknown;
}

export class Event<K extends keyof ClientEvents> {
    public name: K;
    public once: boolean;
    public execute: (client: HypezClient, ...args: ClientEvents[K]) => Promise<unknown> | unknown;

    constructor(options: EventOptions<K>) {
        this.name = options.name;
        this.once = options.once ?? false;
        this.execute = options.execute;
    }
}
