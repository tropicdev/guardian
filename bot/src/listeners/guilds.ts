import { Guild, Events } from 'discord.js';
import { Listener } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { client } from '..';
import { env } from '../env/bot';

@ApplyOptions<Listener.Options>({ event: Events.GuildCreate, name: 'Guild Join' })
export class BotJoin extends Listener {
	public async run(guild: Guild) {
		try {
			await fetch(`${env.API_URL}/v1/guilds/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
					// Authorization: `Bearer ${env.API_TOKEN}`
				},
				body: JSON.stringify({
					guildId: guild.id,
					ownerId: guild.ownerId
				})
			});
			client.logger.info(`Joined guild ${guild.name} (${guild.id})`);
		} catch (error) {
			client.logger.error(error);
		}
	}
}
