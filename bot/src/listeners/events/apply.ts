import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { ButtonInteraction, EmbedBuilder, Events, GuildMember, Interaction, Message, TextChannel } from 'discord.js';
import { client } from '../..';
import { db } from '../../database/db';
import { APPLICATION_ROW, BUTTON_IDS } from '../../lib/constants';
import { CONFIG } from '../../lib/setup';
import type { Responses } from '../../lib/types';

@ApplyOptions<Listener.Options>({ event: Events.InteractionCreate, name: 'Member Apply' })
export class ApplyButtonEvent extends Listener {
	public async run(interaction: Interaction) {
		if (!interaction.isButton() || interaction.member?.user.bot || interaction.customId !== BUTTON_IDS.APPLY) return;

		try {
			return this.sendQuestions(interaction);
		} catch (error) {
			client.logger.error(error);
			return interaction.reply({ content: 'Sorry, something went wrong', ephemeral: true });
		}
	}

	private async sendQuestions(interaction: ButtonInteraction) {
		const member = interaction.member as GuildMember;

		const questions = CONFIG.applications.questions;

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
		const channel = (await client.channels.fetch(CONFIG.applications.channel)) as TextChannel;

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

		await db
			.insertInto('application')
			.values({
				id: message.id,
				applicant_id: member.id,
				content: JSON.stringify(responses),
				status: 'PENDING'
			})
			.execute();
	}
}
