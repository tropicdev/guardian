import { ApplyOptions, RequiresGuildContext } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { ActionRowBuilder, ButtonBuilder, EmbedBuilder, Message, TextChannel } from 'discord.js';
import { z } from 'zod';
import { client } from '../..';
import { env } from '../../env/bot';
import { BUTTON_IDS } from '../../lib/constants';

@ApplyOptions<Command.Options>({
	description: 'Send application embed to specified member join channel'
})
export class UserCommand extends Command {
	@RequiresGuildContext((message: Message) => send(message, 'This command can only be used in servers'))
	public async messageRun(message: Message) {
		try {
			const guild = message.guild;

			const settings = await this.getBootStrapSettings(message.guild!.id);

			if (!settings) {
				return message.reply(
					"Sorry, the applications module doesn't seem to be configured. Please update the settings via the dashboard and try again"
				);
			}

			const joinChannel = (await guild?.channels.fetch(settings.welcomeChannel)) as TextChannel;

			const button = new ButtonBuilder().setCustomId(BUTTON_IDS.APPLY).setStyle(1).setLabel('Apply').setEmoji('📜');

			const row = new ActionRowBuilder<ButtonBuilder>().addComponents([button]);

			const embed = new EmbedBuilder().setColor('Blue').setTitle('Beep Boop').setDescription(settings.welcomeMessage).setTimestamp();

			return joinChannel.send({ embeds: [embed], components: [row] });
		} catch (error) {
			client.logger.error(error);
			return message.channel.send('An error occurred while trying to send the greet embed');
		}
	}

	private async getBootStrapSettings(guild_id: string) {
		try {
			const res = await fetch(`${env.API_URL}/v1/settings/bootstrap/guilds/${guild_id}`);

			const BootstrapSchema = z
				.object({
					welcomeChannel: z.string(),
					welcomeMessage: z.string(),
					featureFlag: z.number()
				})
				.nullable();

			const settings = await res.json();

			const data = await BootstrapSchema.parseAsync(settings);

			if (!data) {
				return null;
			}

			if ((data.featureFlag & 1) === 0) return null;

			if (!data.welcomeMessage || !data.welcomeChannel) return null;

			return data;
		} catch (error) {
			client.logger.error(error);
			return;
		}
	}
}
