import { ApplyOptions, RequiresGuildContext } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { EmbedBuilder, Message } from 'discord.js';
import { z } from 'zod';
import { client } from '../..';
import { env } from '../../env/bot';

@ApplyOptions<Subcommand.Options>({
	description: 'Toggle settings',
	requiredUserPermissions: 'Administrator',
	subcommands: [
		{
			name: 'application',
			messageRun: 'toggleApplication'
		},
		{
			name: 'interview',
			messageRun: 'toggleInterview'
		},
		{
			name: 'whitelist',
			messageRun: 'toggleWhitelist'
		},
		{
			name: 'inactivity',
			messageRun: 'toggleInactivity'
		}
	]
})
export class UserCommand extends Subcommand {
	@RequiresGuildContext((message: Message) => send(message, 'This sub-command can only be used in servers'))
	public async toggleApplication(message: Message) {
		const featureFlag = await this.getFeatureFlags(message.guildId!);

		if (featureFlag instanceof Error) return send(message, 'There was an error while trying to get server settings from the database');

		let settingsBitField = featureFlag;

		settingsBitField ^= 1;

		await this.setFeatureFlags(message.guildId!, settingsBitField);

		return settingsBitField & 1
			? send(message, { embeds: [this.actionEmbed('Application module', 'enabled')] })
			: send(message, { embeds: [this.actionEmbed('Application module', 'disabled')] });
	}
	@RequiresGuildContext((message: Message) => send(message, 'This sub-command can only be used in servers'))
	public async toggleInterview(message: Message) {
		const featureFlag = await this.getFeatureFlags(message.guildId!);

		if (featureFlag instanceof Error) return send(message, 'There was an error while trying to get server settings from the database');

		let settingsBitField = featureFlag;

		settingsBitField ^= 2;

		await this.setFeatureFlags(message.guildId!, settingsBitField);

		return settingsBitField & 2
			? send(message, { embeds: [this.actionEmbed('Interview module', 'enabled')] })
			: send(message, { embeds: [this.actionEmbed('Interview module', 'disabled')] });
	}
	@RequiresGuildContext((message: Message) => send(message, 'This sub-command can only be used in servers'))
	public async toggleWhitelist(message: Message) {
		const featureFlag = await this.getFeatureFlags(message.guildId!);

		if (featureFlag instanceof Error) return send(message, 'There was an error while trying to get server settings from the database');

		let settingsBitField = featureFlag;

		settingsBitField ^= 3;

		await this.setFeatureFlags(message.guildId!, settingsBitField);

		return settingsBitField & 3
			? send(message, { embeds: [this.actionEmbed('Whitelist module', 'enabled')] })
			: send(message, { embeds: [this.actionEmbed('Whitelist module', 'disabled')] });
	}
	@RequiresGuildContext((message: Message) => send(message, 'This sub-command can only be used in servers'))
	public async toggleInactivity(message: Message) {
		const featureFlag = await this.getFeatureFlags(message.guildId!);

		if (featureFlag instanceof Error) return send(message, 'There was an error while trying to get server settings from the database');

		let settingsBitField = featureFlag;

		settingsBitField ^= 4;

		await this.setFeatureFlags(message.guildId!, settingsBitField);

		return settingsBitField & 4
			? send(message, { embeds: [this.actionEmbed('Inactivity module', 'enabled')] })
			: send(message, { embeds: [this.actionEmbed('Inactivity module', 'disabled')] });
	}
	private actionEmbed(module: string, action: string) {
		return new EmbedBuilder().setColor('#3986E4').setDescription(`${module} is ${action}`).setTitle('Configuration Log').setTimestamp();
	}
	private async getFeatureFlags(guildId: string) {
		try {
			const res = await fetch(`${env.API_URL}/v1/features/guilds/${guildId}`);

			const flag = await res.json();

			const FeatureFlagSchema = z
				.object({
					featureFlag: z.number()
				})
				.nullable();

			const data = await FeatureFlagSchema.parseAsync(flag);

			if (!data) {
				return new Error('No data returned from database');
			}

			return data.featureFlag;
		} catch (error) {
			client.logger.error(error);
			return new Error('No data returned from database');
		}
	}

	private async setFeatureFlags(guildId: string, featureFlag: number) {
		try {
			await fetch(`${env.API_URL}/v1/features/guilds/${guildId}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					featureFlag
				})
			});

			return;
		} catch (error) {
			client.logger.error(error);
			return;
		}
	}
}
