import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { ButtonInteraction, EmbedBuilder, Events, GuildMember, Interaction, Message, TextChannel } from 'discord.js';
import { z } from 'zod';
import { client } from '..';
import { env } from '../env/bot';
import { APPLICATION_ROW, BUTTON_IDS } from '../lib/constants';
import type { Responses } from '../lib/types';

@ApplyOptions<Listener.Options>({ event: Events.InteractionCreate, name: 'Member Apply' })
export class ApplyButtonEvent extends Listener {
	public async run(interaction: Interaction) {
		if (!interaction.isButton() || interaction.member?.user.bot || interaction.customId !== BUTTON_IDS.APPLY) return;

		try {
			const flag = await this.getSettings(interaction.guildId!);

			if (!flag) {
				return interaction.reply({ content: 'Sorry, the applications module does not seem to be configured', ephemeral: true });
			}

			if ((flag & 1) === 0) {
				return interaction.reply({ content: 'Sorry, the applications module does not seem to be configured', ephemeral: true });
			}

			return this.sendQuestions(interaction);
		} catch (error) {
			client.logger.error(error);
			return interaction.reply({ content: 'Sorry, something went wrong', ephemeral: true });
		}
	}

	private async getSettings(guild_id: string) {
		try {
			const res = await fetch(`${env.API_URL}/v1/features/guilds/${guild_id}`);

			const FlagSchema = z
				.object({
					featureFlag: z.number()
				})
				.nullable();
			const data = await FlagSchema.parseAsync(await res.json());

			if (!data) {
				return null;
			}

			return data.featureFlag;
		} catch (error) {
			client.logger.error(error);
			return null;
		}
	}

	private async sendQuestions(interaction: ButtonInteraction) {
		const member = interaction.member as GuildMember;

		const res = await fetch(`${env.API_URL}/v1/questions/guilds/${interaction.guildId}`);

		const QuestionSchema = z.string().array().nullable();

		const questions = await QuestionSchema.parseAsync(await res.json());

		if (!questions) return interaction.reply('There are no questions configured');

		interaction.reply({ content: 'Check your direct messages', ephemeral: true });

		let index = 0;

		const responses: Responses = [];

		const filter = (m: Message) => m.author.id === member.id;

		while (index < questions.length) {
			const question = questions[index++];

			const embed = new EmbedBuilder().setTitle(`Question: ${index}`).setDescription(question).setColor('Aqua').setTimestamp();

			const { channel } = await member.send({ embeds: [embed] });

			const collector = channel.createMessageCollector({ filter });

			await new Promise((resolve) => collector.once('collect', resolve));

			responses.push({
				question: question,
				content: collector.collected.first()!.content
			});
		}

		const reply = new EmbedBuilder().setTitle('Application Received').setColor('Yellow').setTimestamp();

		member.send({ embeds: [reply] });

		return this.postApplication(responses, member);
	}

	async postApplication(responses: Responses, member: GuildMember) {
		const res = await fetch(`${env.API_URL}/v1/settings/application/guilds/${member.guild.id}`);

		const ChannelSchema = z
			.object({
				applicationChannel: z.string()
			})
			.nullish();

		const setting = await ChannelSchema.parseAsync(await res.json());

		if (!setting) return;

		const channel = (await client.channels.fetch(setting.applicationChannel)) as TextChannel;

		//TODO Log error
		if (!channel) return;

		const fields = responses.map(({ question, content }) => {
			return {
				name: question,
				value: content,
				inline: false
			};
		});

		const embed = new EmbedBuilder()
			.setColor('Yellow')
			.setAuthor({
				name: member.displayName,
				iconURL: member.user.displayAvatarURL({ forceStatic: false })
			})
			.setTitle(`${member.user.tag} has submitted an application`)
			.setThumbnail(member.displayAvatarURL({ forceStatic: false }))
			.setFields(fields)
			.setTimestamp();

		const message = await channel.send({
			embeds: [embed],
			components: [APPLICATION_ROW]
		});

		await fetch(`${env.API_URL}/v1/application/guilds/${member.guild.id}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				messageId: message.id,
				applicantId: member.id,
				content: JSON.stringify(responses)
			})
		});
	}
}
