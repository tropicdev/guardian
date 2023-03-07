import { client } from '../..';
import { Command } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { EmbedBuilder, Message, TextChannel } from 'discord.js';
import { ApplyOptions, RequiresGuildContext } from '@sapphire/decorators';
import { z } from 'zod';
import { db } from '../../database/db';
import { CONFIG } from '../../lib/setup';

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
			if (interaction.member?.user.bot) return interaction.reply('Bots cannot accept members');
			const application = await this.getApplicant(interaction.channelId!);

			if (!application) return interaction.reply('Something went wrong trying to accept member');

			const { value } = interaction.options.get('username', true);

			if (!value) return interaction.reply('Please provide a minecraft username');

			const [member, mojangUser] = await Promise.all([
				await interaction.guild?.members.fetch(application.applicant_id),
				await getMojangProfile(value.toString())
			]);

			if (!member) return interaction.reply('Member not found');

			if (!mojangUser) return interaction.reply('Minecraft profile not found');

			const [memberRole, interviewRole, acceptChannel] = await Promise.all([
				await interaction.guild?.roles.fetch(CONFIG.member_role),
				await interaction.guild?.roles.fetch(CONFIG.interviews.role),
				(await interaction.guild?.channels.fetch(CONFIG.accept_channel)) as TextChannel
			]);

			if (!memberRole || !interviewRole || !acceptChannel)
				return interaction.reply('Member role, welcome message or channel are not configured');

			await db
				.insertInto('member')
				.values({
					discord_id: member.id,
					mojang_id: addDashes(mojangUser.id)
				})
				.execute()
				.catch((error) => {
					client.logger.error(error);
					return interaction.reply({ content: 'Something went wrong trying to accept member', ephemeral: true });
				});

			await db
				.updateTable('interview')
				.set({ status: 'ACCEPTED' })
				.where('thread_id', '=', interaction.channelId)
				.execute()
				.catch((error) => {
					client.logger.error(error);
					return interaction.reply({ content: 'Something went wrong trying to accept member', ephemeral: true });
				});

			await db
				.insertInto('application_meta')
				.values({
					id: application.id,
					admin_id: interaction.member!.user.id,
					response: 'Member Accepted'
				})
				.execute()
				.catch((error) => {
					client.logger.error(error);
					return interaction.reply({ content: 'Something went wrong trying to accept member', ephemeral: true });
				});

			await member.roles.remove(interviewRole).catch((error) => {
				client.logger.error(error);
				return interaction.reply({ content: 'Something went wrong trying to accept member', ephemeral: true });
			});

			await member.roles.add(memberRole).catch((error) => {
				client.logger.error(error);
				return interaction.reply({ content: 'Something went wrong trying to accept member', ephemeral: true });
			});

			await acceptChannel.send(CONFIG.accept_message.replace('{member}', member.toString())).catch((error) => {
				client.logger.error(error);
				return interaction.reply({ content: 'Something went wrong trying to accept member', ephemeral: true });
			});

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

			return await interaction.reply({ embeds: [embed] });
		} catch (error) {
			client.logger.error(error);
			return interaction.reply({ content: 'Something went wrong trying to accept member', ephemeral: true });
		}
	}

	private async getApplicant(threadId: string) {
		const applicant = await db
			.selectFrom('application')
			.innerJoin('interview', 'interview.application_id', 'id')
			.select(['applicant_id', 'id'])
			.where('thread_id', '=', threadId)
			.executeTakeFirst();
		return applicant;
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
