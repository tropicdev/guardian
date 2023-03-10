import type { Events } from '@sapphire/framework';
import { Listener } from '@sapphire/framework';
import { Message, StageChannel, VoiceChannel } from 'discord.js';

export class UserEvent extends Listener<typeof Events.MentionPrefixOnly> {
	public async run(message: Message) {
		const prefix = this.container.client.options.defaultPrefix;

		const channel = message.channel;

		if (channel instanceof StageChannel || channel instanceof VoiceChannel) {
			return;
		} else {
			return channel.send(prefix ? `My prefix in this guild is: \`${prefix}\`` : 'Cannot find any Prefix for Message Commands.');
		}
	}
}
