import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { ButtonInteraction, ChannelType, EmbedBuilder, Events, GuildMember, Interaction, TextChannel } from 'discord.js';
import { client } from '../..';
import { db } from '../../database/db';
import { BUTTON_IDS } from '../../lib/constants';
import { CONFIG } from '../../lib/setup';

@ApplyOptions<Listener.Options>({ event: Events.InteractionCreate, name: 'Accept Member' })
export class AcceptButtonEvent extends Listener {
	public async run(interaction: Interaction) {
		if (!interaction.isButton() || interaction.member?.user.bot || interaction.customId !== BUTTON_IDS.ACCEPT) return;

		try {
			const data = await db.selectFrom('application').select('applicant_id').where('id', '=', interaction.message.id).executeTakeFirst();

			if (!data) return interaction.reply({ content: 'Could not find application in database', ephemeral: true });

			const applicant = await interaction.guild?.members.fetch(data.applicant_id);

			if (!applicant) return interaction.reply({ content: 'Could not find applicant in guild', ephemeral: true });

			return this.createInterview(applicant, interaction);
		} catch (error) {
			client.logger.error(error);
			return interaction.reply({ content: 'Something went wrong', ephemeral: true });
		}
	}
	private async createInterview(applicant: GuildMember, interaction: ButtonInteraction) {
		try {
			const settings = {
				interviewRole: CONFIG.interviews.role,
				interviewChannel: CONFIG.interviews.channel,
				interviewMessage: CONFIG.interviews.notification
			};

			const role = await applicant.guild.roles.fetch(settings.interviewRole);

			const channel = (await applicant.guild.channels.fetch(settings.interviewChannel)) as TextChannel;

			const notification = settings.interviewMessage.replace(/{member}/g, applicant.toString());

			applicant.roles.add(role!);

			await applicant.send(`You have been accepted for an interview in ${channel}!`).catch(async (error) => {
				client.logger.error(error as Error);
				await interaction.reply({ content: 'Could not send message to applicant', ephemeral: true });
			});

			const thread = await channel.threads.create({
				name: `${applicant.user.tag}`,
				reason: 'Member Application accepted',
				type: ChannelType.PrivateThread
			});

			await db
				.insertInto('interview')
				.values({
					thread_id: thread.id,
					application_id: interaction.message.id,
					status: 'ONGOING'
				})
				.execute();

			await db.updateTable('application').set({ status: 'ACCEPTED' }).where('id', '=', interaction.message.id).execute();

			const adminRole = await interaction.guild?.roles.fetch(CONFIG.admin_role).catch((error) => {
				client.logger.error(error);
				interaction.reply({ content: 'Could not find admin role', ephemeral: true });
				return null;
			});

			if (!adminRole) return;

			const membersWithRole = adminRole.members;

			Promise.all([
				await thread.members.add(applicant),
				await thread.send(notification),
				membersWithRole.forEach(async (member) => {
					thread.members.add(member).catch((error) => {
						client.logger.error(error);
						interaction.reply({ content: 'Could not add admin to thread', ephemeral: true });
						return;
					});
				})
			]);

			const newEmbed = EmbedBuilder.from(interaction.message.embeds[0])
				.setColor('Green')
				.setTimestamp()
				.setFooter({ text: `Member accepted by ${interaction.member!.user.username}` });

			return await interaction.update({ embeds: [newEmbed], components: [] }).catch((error) => {
				client.logger.error(error);
				return interaction.reply({ content: 'Something went wrong trying to accepting member', ephemeral: true });
			});
		} catch (error) {
			client.logger.error(error as Error);
			return interaction.reply({ content: 'Could not create interview', ephemeral: true });
		}
	}
}
