import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { ButtonInteraction, ChannelType, EmbedBuilder, Events, GuildMember, Interaction, TextChannel } from 'discord.js';
import { z } from 'zod';
import { client } from '..';
import { env } from '../env/bot';
import { BUTTON_IDS } from '../lib/constants';

@ApplyOptions<Listener.Options>({ event: Events.InteractionCreate, name: 'Accept Member' })
export class AcceptButtonEvent extends Listener {
	public async run(interaction: Interaction) {
		if (!interaction.isButton() || interaction.member?.user.bot || interaction.customId !== BUTTON_IDS.ACCEPT) return;

		try {
			const res = await fetch(`${env.API_URL}/v1/settings/accept/guilds/${interaction.guildId}/message/${interaction.message.id}`);

			const response = await res.json();

			const ApplicationSchema = z
				.object({
					applicantId: z.string(),
					featureFlag: z.number()
				})
				.nullish();

			const data = await ApplicationSchema.parseAsync(response);

			if (!data) return interaction.reply({ content: 'Could not find application in database', ephemeral: true });

			const applicant = await interaction.guild?.members.fetch(data.applicantId);

			if (!applicant) return interaction.reply({ content: 'Could not find applicant in guild', ephemeral: true });

			if ((data.featureFlag & 2) === 0) {
				return this.acceptMember(applicant, interaction);
			}

			return this.createInterview(applicant, interaction);
		} catch (error) {
			client.logger.error(error);
			return interaction.reply({ content: 'Something went wrong', ephemeral: true });
		}
	}

	private async acceptMember(applicant: GuildMember, interaction: ButtonInteraction) {
		try {
			const res = await fetch(
				`${env.API_URL}/v1/accept/guilds/${interaction.guildId}/application/${interaction.message.id}/admin/${interaction.user.id}`,
				{
					method: 'POST'
				}
			);
			const response = await res.json();

			const SettingsSchema = z
				.object({
					acceptChannel: z.string(),
					acceptMessage: z.string(),
					acceptRole: z.string()
				})
				.nullish();

			const settings = await SettingsSchema.parseAsync(response);

			if (!settings) {
				return interaction.reply({ content: 'Settings are not configured', ephemeral: true });
			}

			await applicant.roles.add(settings.acceptRole);

			const channel = (await client.channels.fetch(settings.acceptChannel)) as TextChannel;

			const message = settings.acceptMessage.replace(/{member}/g, applicant.toString());

			const newEmbed = EmbedBuilder.from(interaction.message.embeds[0])
				.setColor('Green')
				.setTimestamp()
				.setFooter({ text: `Member accepted by ${interaction.member!.user.username}` });

			interaction.update({ embeds: [newEmbed], components: [] });

			return await channel.send(message);
		} catch (error) {
			console.error(error);
			return interaction.reply('There was an error while sending the welcome message');
		}
	}
	private async createInterview(applicant: GuildMember, interaction: ButtonInteraction) {
		try {
			const res = await fetch(`${env.API_URL}/v1/settings/interview/guilds/${interaction.guildId}`);

			const response = await res.json();

			const SettingsSchema = z
				.object({
					interviewRole: z.string(),
					interviewMessage: z.string(),
					interviewChannel: z.string()
				})
				.nullish();

			const settings = await SettingsSchema.parseAsync(response);

			if (!settings) {
				return interaction.reply({ content: 'Interview settings are not configured', ephemeral: true });
			}

			const role = await applicant.guild.roles.fetch(settings.interviewRole);

			const channel = (await applicant.guild.channels.fetch(settings.interviewChannel)) as TextChannel;

			const notification = settings.interviewMessage.replace(/{member}/g, applicant.toString());

			applicant.roles.add(role!);

			try {
				await applicant.send(`You have been accepted for an interview in ${channel}!`);
			} catch (error) {
				client.logger.error(error as Error);
				await interaction.reply({ content: 'Could not send message to applicant', ephemeral: true });
			}

			const thread = await channel.threads.create({
				name: `${applicant.user.tag}`,
				reason: 'Member Application accepted',
				type: ChannelType.PrivateThread
			});

			await fetch(`${env.API_URL}/v1/interview/guilds/${interaction.guildId}/application/${interaction.message.id}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					threadId: thread.id,
					response: 'Interview created',
					adminId: interaction.user.id
				})
			});

			thread.send(notification);

			thread.members.add(applicant);

			thread.members.add(interaction.member as GuildMember);

			const newEmbed = EmbedBuilder.from(interaction.message.embeds[0])
				.setColor('Green')
				.setTimestamp()
				.setFooter({ text: `Member accepted by ${interaction.member!.user.username}` });

			return await interaction.update({ embeds: [newEmbed], components: [] });
		} catch (error) {
			client.logger.error(error as Error);
			return interaction.reply({ content: 'Could not create interview', ephemeral: true });
		}
	}
}
