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

export const EVENTS = {
	GUARDIAN_MEMBER_BAN: 'GUARDIAN:MEMBER_BAN',
	GUARDIAN_MEMBER_LEAVE: 'GUARDIAN:MEMBER_LEAVE',
	GUARDIAN_MEMBER_ADD: 'GUARDIAN:MEMBER_ADD',
	ELDER_MEMBER_BAN: 'ELDER:MEMBER_BAN',
	ELDER_MEMBER_SESSION_START: 'ELDER:MEMBER_SESSION_START',
	ELDER_MEMBER_SESSION_END: 'ELDER:MEMBER_SESSION_END',
	SUCCESS: 'SUCCESS'
} as const;

export const APPLICATION_ROW = new ActionRowBuilder<ButtonBuilder>()
	.addComponents(new ButtonBuilder().setCustomId(BUTTON_IDS.ACCEPT).setStyle(3).setLabel('Accept').setEmoji('✔️'))
	.addComponents(new ButtonBuilder().setCustomId(BUTTON_IDS.DENY).setStyle(4).setLabel('Deny').setEmoji('❌'));

export const DISABLED_APPLICATION_ROW = new ActionRowBuilder<ButtonBuilder>().addComponents(
	new ButtonBuilder().setStyle(4).setCustomId('disabled').setLabel('Please wait....').setDisabled(true)
);
