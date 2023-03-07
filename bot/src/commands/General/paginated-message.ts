import { ApplyOptions } from '@sapphire/decorators';
import { PaginatedMessage } from '@sapphire/discord.js-utilities';
import { Command } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { EmbedBuilder } from 'discord.js';
import { send } from '@sapphire/plugin-editable-commands';
import { RandomLoadingMessage } from '../../lib/constants';

//TODO Use to see DAEMON statuses
@ApplyOptions<Command.Options>({
	aliases: ['pm'],
	description: 'A command that uses paginated messages.',
	generateDashLessAliases: true
})
export class UserCommand extends Command {
	public async messageRun(message: Message) {
		const response = await sendLoadingMessage(message);

		const paginatedMessage = new PaginatedMessage({
			template: new EmbedBuilder()
				.setColor('#FF0000')
				// Be sure to add a space so this is offset from the page numbers!
				.setFooter({ text: ' footer after page numbers' })
		});

		paginatedMessage
			.addPageEmbed((embed) =>
				embed //
					.setDescription('This is the first page')
					.setTitle('Page 1')
			)
			.addPageBuilder((builder) =>
				builder //
					.setContent('This is the second page')
					.setEmbeds([new EmbedBuilder().setTimestamp()])
			);

		await paginatedMessage.run(response, message.author);
		return response;
	}
}

/**
 * Sends a loading message to the current channel
 * @param message The message data for which to send the loading message
 */
function sendLoadingMessage(message: Message): Promise<typeof message> {
	return send(message, { embeds: [new EmbedBuilder().setDescription(pickRandom(RandomLoadingMessage)).setColor('#FF0000')] });
}

/**
 * Picks a random item from an array
 * @param array The array to pick a random item from
 * @example
 * const randomEntry = pickRandom([1, 2, 3, 4]) // 1
 */

function pickRandom<T>(array: readonly T[]): T {
	const { length } = array;
	return array[Math.floor(Math.random() * length)];
}
