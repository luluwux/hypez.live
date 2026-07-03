import { Command } from '../../structures/command';
import { handleHypeFlow } from '../../handlers/hype.handler';

export default new Command({
    name: 'hype',
    description: 'Hype this server! (3 hypes/week, 12h cooldown between each)',
    category: 'public',
    execute: async (client, interaction) => {
        await handleHypeFlow(client, interaction);
    },
});
