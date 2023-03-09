import { EmbedBuilder, TextChannel } from 'discord.js';
import { sql } from 'kysely';
import { client } from '..';
import { db } from '../database/db';
import { CONFIG } from './setup';

export async function purge() {
	try {
		const result = await sql<{ discord_id: string; mojang_id: string }>`SELECT discord_id, mojang_id
    FROM member m
    LEFT JOIN session s ON m.id = s.member_id AND s.session_start >= DATE_SUB(NOW(), INTERVAL 60 DAY)
    WHERE s.id IS NULL;`.execute(db);

		client.logger.info(`Purging ${result.rows.length} sessions...`);

		const console = (await client.channels.fetch(CONFIG.console_channel)) as TextChannel;
		const guild = await client.guilds.fetch(CONFIG.guild_id);

		if (!console) return;

		if (!guild) return;

		result.rows.forEach(async (row) => {
			const member = await guild.members.fetch(row.discord_id).catch(async () => {
				client.logger.warn(`Failed to fetch member ${row.discord_id}`);

				const embed = new EmbedBuilder()
					.setColor('Red')
					.setAuthor({
						name: 'Guardian',
						iconURL: 'https://cdn.discordapp.com/avatars/1063626648399921170/60021a9282221d831512631d8e82b33d.png'
					})
					.setTitle('Failed to Purge Member')
					.addFields([
						{ name: 'Member ID', value: `${row.discord_id}`, inline: true },
						{ name: 'Mojang ID', value: `${row.mojang_id}`, inline: true }
					])
					.setTimestamp();

				await console.send({ embeds: [embed] });
				return;
			});

			if (!member) return;

			if (member.roles.cache.has(CONFIG.whitelist_manager.inactivity.vacation_role)) {
				client.logger.info(`Skipping member ${member.id} as they have the vacation role`);
				const embed = new EmbedBuilder()
					.setColor('Blue')
					.setAuthor({
						name: 'Guardian',
						iconURL: 'https://cdn.discordapp.com/avatars/1063626648399921170/60021a9282221d831512631d8e82b33d.png'
					})
					.setTitle('Skipping Member')
					.addFields([
						{ name: 'Member ID', value: `${member.id}`, inline: true },
						{ name: 'Mojang ID', value: `${row.mojang_id}`, inline: true }
					])
					.setTimestamp();

				await console.send({ embeds: [embed] });
				return;
			}

			await member.send(CONFIG.whitelist_manager.inactivity.message).catch(async () => {
				client.logger.warn(`Failed to send message to member ${member.id}`);
				const embed = new EmbedBuilder()
					.setColor('Red')
					.setAuthor({
						name: 'Guardian',
						iconURL: 'https://cdn.discordapp.com/avatars/1063626648399921170/60021a9282221d831512631d8e82b33d.png'
					})
					.setTitle('Failed to Send Member Kick Message')
					.addFields([
						{ name: 'Member ID', value: `${member.id}`, inline: true },
						{ name: 'Mojang ID', value: `${row.mojang_id}`, inline: true }
					])
					.setTimestamp();

				await console.send({ embeds: [embed] });
				return;
			});

			await member.kick('Inactive').catch(async () => {
				client.logger.warn(`Failed to kick member ${member.id}`);

				const embed = new EmbedBuilder()
					.setColor('Red')
					.setAuthor({
						name: 'Guardian',
						iconURL: 'https://cdn.discordapp.com/avatars/1063626648399921170/60021a9282221d831512631d8e82b33d.png'
					})
					.setTitle('Failed to Kick Member')
					.addFields([
						{ name: 'Member ID', value: `${member.id}`, inline: true },
						{ name: 'Mojang ID', value: `${row.mojang_id}`, inline: true }
					])
					.setTimestamp();

				await console.send({ embeds: [embed] });
				return;
			});

			const embed = new EmbedBuilder()
				.setColor('Blue')
				.setAuthor({
					name: 'Guardian',
					iconURL: 'https://cdn.discordapp.com/avatars/1063626648399921170/60021a9282221d831512631d8e82b33d.png'
				})
				.setTitle('Member Purged')
				.setImage(member.user.displayAvatarURL())
				.addFields([
					{ name: 'Member ID', value: `${member.id}`, inline: true },
					{ name: 'Member Name', value: `${member.displayName}`, inline: true },
					{ name: 'Mojang ID', value: `${row.mojang_id}`, inline: true }
				])
				.setTimestamp();

			await console.send({ embeds: [embed] });
		});
	} catch (error) {
		client.logger.error(error);
		return;
	}
}
