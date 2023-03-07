import { client } from '../..';
import { Command } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { EmbedBuilder, Message, TextChannel } from 'discord.js';
import { ApplyOptions, RequiresGuildContext } from '@sapphire/decorators';
import { z } from 'zod';
import { env } from '../../env/bot';
import type { MojangUser } from '../../lib/types';

@ApplyOptions<Command.Options>({
	description: 'Accept Member',
	requiredUserPermissions: 'Administrator',
	options: []
})
export class UserCommand extends Command {
	// Register slash and context menu command
	public override registerApplicationCommands(registry: Command.Registry) {
		// Register slash command
		registry.registerChatInputCommand((builder) =>
			builder
				.setName('accept')
				.setDescription('Accept Member')
				.addStringOption((option) => option.setName('username').setDescription('Minecraft username for the user').setRequired(true))
		);
	}

	@RequiresGuildContext((message: Message) => send(message, 'This command can only be used in servers'))
	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		try {
			const data = await this.getSettings(interaction.guildId!, interaction.channelId!);

			if (!data) return interaction.reply('Something went wrong trying to accept member');

			const { value } = interaction.options.get('username', true);

			if (!value) return interaction.reply('Please provide a minecraft username');

			const [member, mojangUser] = await Promise.all([
				await interaction.guild?.members.fetch(data.applicantId),
				await getMojangProfile(value.toString())
			]);

			if (!member) return interaction.reply('Member not found');

			if (!mojangUser) return interaction.reply('Minecraft profile not found');

			const [memberRole, interviewRole, acceptChannel] = await Promise.all([
				await interaction.guild?.roles.fetch(data.acceptRole),
				await interaction.guild?.roles.fetch(data.interviewRole),
				(await interaction.guild?.channels.fetch(data.acceptChannel)) as TextChannel
			]);

			if (!memberRole || !interviewRole || !acceptChannel)
				return interaction.reply('Member role, welcome message or channel are not configured');

			await Promise.all([
				await this.createPlayer(mojangUser, interaction.guildId!, member.id, interaction.user.id, data.messageId),

				await member.roles.remove(interviewRole),

				await member.roles.add(memberRole),

				await acceptChannel.send(data.acceptMessage.replace('{member}', member.toString()))
			]);

			const embed = new EmbedBuilder()
				.setColor('#0099ff')
				.setTitle(`Link Created and Member Accepted`)
				.setAuthor({
					name: 'Botler',
					iconURL: 'https://cdn.discordapp.com/avatars/1063626648399921170/60021a9282221d831512631d8e82b33d.png'
				})
				.addFields({ name: 'Discord Name', value: `${member}`, inline: true }, { name: 'IGN', value: `${mojangUser.name}`, inline: true })
				.setImage(`https://crafatar.com/renders/body/${mojangUser.id}?scale=3`)
				.setTimestamp();

			// const mojang_user: MojangUser = {
			// 	id: addDashes(mojangUser.id),
			// 	name: mojangUser.name
			// };

			// ws.emit(EVENTS.BOTLER_MEMBER_ACCEPT, mojang_user);

			return await interaction.reply({ embeds: [embed] });
		} catch (error) {
			client.logger.error(error);
			return interaction.reply({ content: 'Something went wrong trying to accept member', ephemeral: true });
		}
	}

	private async getSettings(guildId: string, channelId: string) {
		const res = await fetch(`${env.API_URL}/v1/settings/accept/guilds/${guildId}/threads/${channelId}`);

		const response = await res.json();

		const SettingSchema = z
			.object({
				messageId: z.string(),
				threadId: z.string(),
				applicantId: z.string(),
				acceptMessage: z.string(),
				acceptChannel: z.string(),
				acceptRole: z.string(),
				interviewRole: z.string()
			})
			.nullish();

		const settings = await SettingSchema.parseAsync(response);

		return settings;
	}

	private async createPlayer(mojangUser: MojangUser, guildId: string, discordId: string, adminId: string, messageId: string) {
		try {
			await fetch(`${env.API_URL}/v1/accept/guilds/${guildId}/interview/${messageId}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					mojangId: addDashes(mojangUser.id),
					discordId: discordId,
					response: 'Accepted Member',
					adminId: adminId
				})
			});

			return true;
		} catch (error) {
			client.logger.error(error);
			return false;
		}
	}
}

async function getMojangProfile(username: string) {
	const response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);

	if (response.status === 204 || response.status === 404) {
		return null;
	}

	const MojangProfileSchema = z.object({
		id: z.string(),
		name: z.string()
	});

	const data = MojangProfileSchema.parseAsync(await response.json());

	return data;
}

function addDashes(id: string) {
	const regex = /([0-9a-fA-F]{8})([0-9a-fA-F]{4})([0-9a-fA-F]{4})([0-9a-fA-F]{4})([0-9a-fA-F]+)/g;
	const subst = '$1-$2-$3-$4-$5';
	const newId = id.replace(regex, subst);
	return newId;
}
