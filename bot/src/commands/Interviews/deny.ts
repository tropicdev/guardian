import { ApplyOptions, RequiresGuildContext } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { EmbedBuilder, Message } from 'discord.js';
import { z } from 'zod';
import { client } from '../..';
import { env } from '../../env/bot';

@ApplyOptions<Command.Options>({
	description: 'Deny Member',
	requiredUserPermissions: 'Administrator',
	options: []
})
export class UserCommand extends Command {
	// Register slash and context menu command
	public override registerApplicationCommands(registry: Command.Registry) {
		// Register slash command
		registry.registerChatInputCommand((builder) =>
			builder
				.setName('deny')
				.setDescription('Deny Member')
				.addStringOption((option) => option.setName('reason').setDescription('Reason for denying member').setRequired(true))
		);
	}

	@RequiresGuildContext((message: Message) => send(message, 'This command can only be used in servers'))
	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		try {
			const { value } = interaction.options.get('reason', true);

			const application = await this.getApplication(interaction.channelId, interaction.guildId!);

			if (!value) return interaction.reply({ content: 'Please provide a reason', ephemeral: true });

			await this.updateApplication(interaction.channelId, interaction.guildId!, interaction.user.id);

			if (application instanceof Error || !application)
				return interaction.reply({ content: 'Something went wrong trying to deny member', ephemeral: true });

			const member = await interaction.guild?.members.fetch(application.applicantId);

			if (!member) return interaction.reply({ content: 'Member not found', ephemeral: true });

			const denyEmbed = new EmbedBuilder()
				.setColor('Red')
				.setTitle(`Denied`)
				.setAuthor({
					name: 'Botler',
					iconURL: 'https://cdn.discordapp.com/avatars/1063626648399921170/60021a9282221d831512631d8e82b33d.png'
				})
				.addFields({ name: 'Reason', value: `${value}`, inline: true })
				.setTimestamp();

			await member.send({ embeds: [denyEmbed] });

			await member.kick(value.toString());

			const embed = new EmbedBuilder()
				.setColor('Red')
				.setTitle(`Applicant Denied`)
				.setAuthor({
					name: 'Botler',
					iconURL: 'https://cdn.discordapp.com/avatars/1063626648399921170/60021a9282221d831512631d8e82b33d.png'
				})
				.addFields({ name: 'Member', value: `${member}`, inline: true }, { name: 'Reason', value: `${value}`, inline: true })
				.setTimestamp();

			return await interaction.reply({ embeds: [embed] });
		} catch (error) {
			client.logger.error(error);
		}
		return interaction.reply('Something went wrong');
	}

	private async getApplication(threadId: string, guildId: string) {
		try {
			const response = await fetch(`${env.API_URL}/v1/deny/guilds/${guildId}/application/${threadId}`);

			const data = await response.json();

			const ApplicationSchema = z
				.object({
					applicantId: z.string()
				})
				.nullish();

			const result = await ApplicationSchema.parseAsync(data);

			return result;
		} catch (error) {
			client.logger.error(error);
			return new Error('Something went wrong');
		}
	}

	private async updateApplication(threadId: string, guildId: string, adminId: string) {
		try {
			await fetch(`${env.API_URL}/v1/deny/guilds/${guildId}/application/${threadId}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					response: 'Accepted Member',
					adminId: adminId
				})
			});

			return;
		} catch (error) {
			client.logger.error(error);
			return new Error('Something went wrong');
		}
	}
}
