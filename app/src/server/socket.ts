import type { TextChannel } from 'discord.js';
import { Server } from 'socket.io';
import { client } from '..';
import { db } from '../database/db';
import { EVENTS } from '../lib/constants';
import { CONFIG } from '../lib/setup';

type BanEvent = {
	mojang_id: string;
	reason: string;
};

type SessionEvent = {
	mojang_id: string;
	server_id: string;
};

type Success = {
	success: boolean;
	msg?: string;
};

export const io = new Server(CONFIG.api_port);

io.on('connection', (socket) => {
	if (socket.handshake.auth.token !== CONFIG.api_token) {
		socket.disconnect(true);
		return;
	}

	socket.join(CONFIG.client_id);

	socket.on(EVENTS.ELDER_MEMBER_BAN, async (msg: BanEvent) => {
		const guild = await client.guilds.fetch(CONFIG.guild_id).catch((error) => {
			client.logger.error(error);
			return null;
		});

		if (!guild) return io.emit(EVENTS.SUCCESS, { success: false });

		const member = await db.selectFrom('member').selectAll().where('mojang_id', '=', msg.mojang_id).executeTakeFirst();

		if (!member) return io.emit(EVENTS.SUCCESS, { success: false });

		const discordMember = await guild.members.fetch(member.discord_id).catch((error) => {
			client.logger.error(error);
			return null;
		});

		if (!discordMember) return io.emit(EVENTS.SUCCESS, { success: false });

		await discordMember.ban({ reason: msg.reason }).catch((error) => {
			client.logger.error(error);
			return null;
		});

		await db
			.updateTable('member')
			.set({
				status: 'BANNED'
			})
			.execute()
			.catch((error) => {
				client.logger.error(error);
				return null;
			});

		return io.emit(EVENTS.SUCCESS, { success: true });
	});

	socket.on(EVENTS.ELDER_MEMBER_SESSION_START, async (msg: SessionEvent) => {
		const member = await db.selectFrom('member').selectAll().where('mojang_id', '=', msg.mojang_id).executeTakeFirst();

		if (!member) return io.emit(EVENTS.SUCCESS, { success: false });

		await db
			.insertInto('session')
			.values({
				server_id: msg.server_id,
				member_id: member.id
			})
			.execute();

		return io.emit(EVENTS.SUCCESS, { success: true });
	});

	socket.on(EVENTS.ELDER_MEMBER_SESSION_END, async (msg: SessionEvent) => {
		const member = await db.selectFrom('member').selectAll().where('mojang_id', '=', msg.mojang_id).executeTakeFirst();

		if (!member) return io.emit(EVENTS.SUCCESS, { success: false });

		const session = await db.selectFrom('session').selectAll().where('member_id', '=', member.id).executeTakeFirst();

		if (!session) return io.emit(EVENTS.SUCCESS, { success: false });

		await db
			.updateTable('session')
			.set({
				session_end: new Date()
			})
			.where('id', '=', session?.id)
			.execute();

		return io.emit(EVENTS.SUCCESS, { success: true });
	});

	socket.on(EVENTS.SUCCESS, async (msg: Success) => {
		if (msg.success) {
			client.logger.info('Successfully sent event to server');

			const console = (await client.channels.fetch(CONFIG.console_channel)) as TextChannel;

			if (!console) return;

			console.send({ content: msg.msg || 'Success' });
			return;
		}

		client.logger.error('Failed to send event to server');
	});

	socket.on('disconnect', () => {
		console.log('user disconnected');
	});
});
