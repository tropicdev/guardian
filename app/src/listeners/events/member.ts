import { Guild, Events, GuildMember } from 'discord.js';
import { Listener } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { z } from 'zod';
import { db } from '../../database/db';
import { client } from '../..';
import { io } from '../../server/socket';
import { EVENTS } from '../../lib/constants';

@ApplyOptions<Listener.Options>({ event: Events.GuildBanAdd, name: 'Handle Guild Member Ban' })
export class MemberBan extends Listener {
	public async run(guild: Guild, member: GuildMember) {
		try {
			if (member.user.bot) return;

			await db
				.updateTable('member')
				.where('discord_id', '=', member.id)
				.set({
					status: 'BANNED'
				})
				.executeTakeFirst();

			const memberProfile = await db.selectFrom('member').selectAll().where('discord_id', '=', member.id).executeTakeFirst();

			if (!memberProfile) {
				client.logger.error(`Player ${member.id} not found`);
				return;
			}

			const mojangProfile = await getMojangProfile(memberProfile.mojang_id);

			if (!mojangProfile) {
				client.logger.error(`Player ${member.user} not found`);
				return;
			}

			const event = {
				id: mojangProfile.id,
				name: mojangProfile.name
			};

			io.emit(EVENTS.GUARDIAN_MEMBER_BAN, event);
		} catch (error) {
			client.logger.error(error);
		}
	}
}

@ApplyOptions<Listener.Options>({ event: Events.GuildMemberRemove, name: 'Handle Guild Member Kick/Leave' })
export class MemberRemove extends Listener {
	public async run(guild: Guild, member: GuildMember) {
		try {
			if (member.user.bot) return;

			await db
				.updateTable('member')
				.where('discord_id', '=', member.id)
				.set({
					status: 'LEFT'
				})
				.executeTakeFirst();

			const memberProfile = await db.selectFrom('member').selectAll().where('discord_id', '=', member.id).executeTakeFirst();

			if (!memberProfile) {
				client.logger.error(`Player ${member.id} not found`);
				return;
			}

			const mojangProfile = await getMojangProfile(memberProfile.mojang_id);

			if (!mojangProfile) {
				client.logger.error(`Player ${member.user} not found`);
				return;
			}
			const event = {
				id: mojangProfile.id,
				name: mojangProfile.name
			};

			io.emit(EVENTS.GUARDIAN_MEMBER_LEAVE, event);
		} catch (error) {
			client.logger.error(error);
		}
	}
}

async function getMojangProfile(id: string) {
	const response = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${id}`);

	if (response.status === 204 || response.status === 404) {
		return null;
	}

	const mojangProfileSchema = z.object({
		id: z.string(),
		name: z.string()
	});

	const data = mojangProfileSchema.parseAsync(await response.json());

	return data;
}
