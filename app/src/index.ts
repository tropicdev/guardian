import './lib/setup';
import { LogLevel, SapphireClient } from '@sapphire/framework';
import { GatewayIntentBits, Partials } from 'discord.js';
import { CONFIG } from './lib/setup';
import { purge } from './lib/purge';

export const client = new SapphireClient({
	defaultPrefix: '!',
	regexPrefix: /^(hey +)?bot[,! ]/i,
	caseInsensitiveCommands: true,
	logger: {
		level: LogLevel.Debug
	},
	shards: 'auto',
	intents: [
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.GuildBans,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.Guilds,
		GatewayIntentBits.MessageContent
	],
	partials: [Partials.Channel, Partials.GuildMember, Partials.Message],
	loadMessageCommandListeners: true
});

const main = async () => {
	try {
		client.logger.info('Guardian is starting up...');
		await client.login(CONFIG.bot_token);
		client.logger.info('Guardian is ready!');
	} catch (error) {
		client.logger.fatal(error);
		client.destroy();
		process.exit(1);
	}

	if (CONFIG.whitelist_manager.enabled) {
		client.logger.info('Whitelist Manager is enabled, scheduling purge job');
		const interval = CONFIG.whitelist_manager.inactivity.clean_whitelist_every_hrs * 3600000;

		setInterval(purge, interval);
	}
};

main();
