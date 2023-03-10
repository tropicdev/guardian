import { EmbedBuilder, TextChannel } from 'discord.js';
import { sql } from 'kysely';
import { Server } from 'socket.io';
import { client } from '..';
import { db } from '../database/db';
import { CONFIG } from '../lib/setup';

type BanEvent = {
	id: string;
	name: string;
	reason: string;
};

type SessionEvent = {
	mojang_id: string;
	server_id: string;
};

type Success = {
	success: boolean;
	server_id: string;
	msg: string;
};

type Auth = {
	token: string;
	server_id: string;
};
export const io = new Server(CONFIG.api_port);

io.use(async (socket, next) => {
	const auth = socket.handshake.auth as Auth;

	const server = await db.selectFrom('server').selectAll().where('id', '=', auth.server_id).executeTakeFirst();

	if (!server) {
		const err = new Error('not authorized');
		err.message = 'Server is not registered';
		return next(err);
	}

	if (server.token !== auth.token) {
		const err = new Error('not authorized');
		err.message = 'Token is not valid';
		return next(err);
	}

	return next();
});

io.on('connection', (socket) => {
	socket.data.serverId = socket.handshake.auth.server_id;

	client.logger.info(`Socket connected: ${socket.id} | ${socket.data.serverId} ✅`);

	socket.join(CONFIG.client_id);

	socket.on('ban', async (msg: BanEvent) => {
		socket.to(CONFIG.client_id).emit('ban', msg);
		try {
			const guild = await client.guilds.fetch(CONFIG.guild_id).catch((error) => {
				client.logger.error(error);
				return null;
			});

			if (!guild) return io.emit('success', { success: false, msg: 'Guild not found' });

			const member = await db.selectFrom('member').selectAll().where('mojang_id', '=', msg.id).executeTakeFirst();

			if (!member) return io.emit('success', { success: false, msg: 'Member not found' });

			const discordMember = await guild.members.fetch(member.discord_id).catch((error) => {
				client.logger.error(error);
				return null;
			});

			if (!discordMember) return io.emit('success', { success: false, msg: 'Discord member not found' });

			await discordMember.ban({ reason: msg.reason }).catch((error) => {
				client.logger.error(error);
				io.emit('success', { success: false, msg: 'Discord member could not be banned' });
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
					io.emit('success', { success: false, msg: 'Failled to update database with banned player' });
					return null;
				});

			return io.emit('success', { success: true, msg: `Banned ${member.mojang_id}` });
		} catch (error) {
			client.logger.error(error);
			return;
		}
	});

	socket.on('session-start', async (msg: SessionEvent) => {
		socket.to(CONFIG.client_id).emit('session-start', msg);
		try {
			const member = await db.selectFrom('member').selectAll().where('mojang_id', '=', msg.mojang_id).executeTakeFirst();

			if (!member) return io.emit('success', { success: false, msg: 'Member not found' });

			await db
				.insertInto('session')
				.values({
					server_id: msg.server_id,
					member_id: member.id
				})
				.execute();

			return io.emit('success', { success: true, msg: `Started session for ${member.mojang_id}` });
		} catch (error) {
			client.logger.error(error);
			return;
		}
	});

	socket.on('session-end', async (msg: SessionEvent) => {
		socket.to(CONFIG.client_id).emit('session-end', msg);

		try {
			const member = await db.selectFrom('member').selectAll().where('mojang_id', '=', msg.mojang_id).executeTakeFirst();

			if (!member) return io.emit('success', { success: false, msg: 'Member not found' });

			const session = await db
				.selectFrom('session')
				.selectAll()
				.where('member_id', '=', member.id)
				.orderBy('session.id', 'desc')
				.executeTakeFirst();

			if (!session) return io.emit('success', { success: false, msg: 'Session not found' });

			await db
				.updateTable('session')
				.set({
					session_end: new Date()
				})
				.where('id', '=', session?.id)
				.execute();

			return io.emit('success', { success: true, msg: `Ended session for ${member.mojang_id}` });
		} catch (error) {
			client.logger.error(error);
			return;
		}
	});

	socket.on('success', async (msg: Success) => {
		try {
			const console = (await client.channels.fetch(CONFIG.console_channel)) as TextChannel;

			if (!console) return;

			if (msg.success) {
				client.logger.info('Successfully sent event to server');

				const embed = new EmbedBuilder()
					.setColor('Green')
					.setTitle(`Success`)
					.setAuthor({
						name: 'Guardian',
						iconURL: 'https://cdn.discordapp.com/avatars/1063626648399921170/60021a9282221d831512631d8e82b33d.png'
					})
					.addFields({ name: 'Message', value: `${msg.msg}`, inline: true }, { name: 'Server ID', value: `${msg.server_id}`, inline: true })
					.setTimestamp();

				console.send({ embeds: [embed] });
				return;
			} else {
				client.logger.info('Failed to send event to server');

				const embed = new EmbedBuilder()
					.setColor('Red')
					.setTitle(`Error`)
					.setAuthor({
						name: 'Guardian',
						iconURL: 'https://cdn.discordapp.com/avatars/1063626648399921170/60021a9282221d831512631d8e82b33d.png'
					})
					.addFields({ name: 'Message', value: `${msg.msg}`, inline: true }, { name: 'Server ID', value: `${msg.server_id}`, inline: true })
					.setTimestamp();

				console.send({ embeds: [embed] });
				return;
			}
		} catch (error) {
			client.logger.error(error);
			return;
		}
	});

	socket.on('disconnect', async () => {
		client.logger.info(`Socket disconnected: ${socket.id} || ${socket.data.serverId} ❌`);
		try {
			client.logger.info('Updating sessions');

			await db
				.updateTable('session')
				.set({ session_end: new Date() })
				.where(sql`session_end IS NULL AND server_id = ${socket.data.serverId}`)
				.execute();
		} catch (error) {
			client.logger.error(error);
			return;
		}
	});
});
