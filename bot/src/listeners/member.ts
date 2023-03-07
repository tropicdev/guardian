// import { Guild, Events, GuildMember } from 'discord.js';
// import { Listener } from '@sapphire/framework';
// import { ApplyOptions } from '@sapphire/decorators';
// import { z } from 'zod';

// @ApplyOptions<Listener.Options>({ event: Events.GuildBanAdd, name: 'Handle Guild Member Ban' })
// export class MemberBan extends Listener {
// 	public async run(guild: Guild, member: GuildMember, reason: string) {
// 		try {
// 			if (member.user.bot) return;

// 			const player_query = {
// 				name: 'ban-player-query',
// 				text: 'update socrates.player set status = $1 where discord_id = $2 and guild_id = $3;',
// 				values: [PlayerStatus.BANNED, member.id, guild.id]
// 			};

// 			const { rows } = await pg.query(player_query);

// 			const data = await PlayerSchema.parseAsync(rows[0]);

// 			const player_data = await getMojangProfile(data.id);

// 			if (!player_data) {
// 				client.logger.error(`Player ${data.discord_id} not found`);
// 				return;
// 			}

// 			const event: BotlerBanEvent = {
// 				id: player_data.id,
// 				name: player_data.name,
// 				reason: reason
// 			};

// 			ws.emit(EVENTS.BOTLER_MEMBER_BAN, event);
// 		} catch (error) {
// 			client.logger.error(error);
// 		}
// 	}
// }

// @ApplyOptions<Listener.Options>({ event: Events.GuildMemberRemove, name: 'Handle Guild Member Kick/Leave' })
// export class MemberRemove extends Listener {
// 	public async run(guild: Guild, member: GuildMember) {
// 		try {
// 			if (member.user.bot) return;

// 			const player_query = {
// 				name: 'remove-player-query',
// 				text: 'update socrates.player set status = $1 where discord_id = $2 and guild_id = $3;',
// 				values: [PlayerStatus.REMOVED, member.id, guild.id]
// 			};

// 			const { rows } = await pg.query(player_query);

// 			const data = await PlayerSchema.parseAsync(rows[0]);

// 			const player_data = await getMojangProfile(data.id);

// 			if (!player_data) {
// 				client.logger.error(`Player ${data.discord_id} not found`);
// 				return;
// 			}

// 			const event: BotlerRemoveEvent = {
// 				id: player_data.id,
// 				name: player_data.name
// 			};

// 			ws.emit(EVENTS.BOTLER_MEMBER_REMOVE, event);
// 		} catch (error) {
// 			client.logger.error(error);
// 		}
// 	}
// }

// async function getMojangProfile(id: string) {
// 	const response = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${id}`);

// 	if (response.status === 204 || response.status === 404) {
// 		return null;
// 	}

// 	const mojangProfileSchema = z.object({
// 		id: z.string(),
// 		name: z.string()
// 	});

// 	const data = mojangProfileSchema.parseAsync(await response.json());

// 	return data;
// }
