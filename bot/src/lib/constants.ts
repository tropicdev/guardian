import { ActionRowBuilder, ButtonBuilder } from 'discord.js';

export const RandomLoadingMessage = ['Computing...', 'Thinking...', 'Cooking some food', 'Give me a moment', 'Loading...'];

export const BUTTON_IDS = {
	APPLY: 'BOTLER:MEMBER_APPLY',
	ACCEPT: 'BOTLER:MEMBER_ACCEPT',
	DENY: 'BOTLER:MEMBER_DENY'
} as const;

export const MODAL_IDS = {
	REASON: 'BOTLER:REASON_MODAL',
	ADMIN_REASON: 'BOTLER:REASON'
} as const;

export const APPLICATION_ROW = new ActionRowBuilder<ButtonBuilder>()
	.addComponents(new ButtonBuilder().setCustomId(BUTTON_IDS.ACCEPT).setStyle(3).setLabel('Accept').setEmoji('✔️'))
	.addComponents(new ButtonBuilder().setCustomId(BUTTON_IDS.DENY).setStyle(4).setLabel('Deny').setEmoji('❌'));

export const DISABLED_APPLICATION_ROW = new ActionRowBuilder<ButtonBuilder>().addComponents(
	new ButtonBuilder().setStyle(4).setCustomId('disabled').setLabel('Please wait....').setDisabled(true)
);
