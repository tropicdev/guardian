// @ts-check
import { z } from 'zod';

export const configSchema = z.object({
	prefix: z.string().default('!'),
	console_channel: z.string(),
	bot_token: z.string(),
	api_token: z.string(),
	api_host: z.string().ip(),
	status: z.string().optional(),
	join_channel: z.string(),
	join_message: z.string(),
	accept_channel: z.string(),
	accept_message: z.string(),
	member_role: z.string(),
	owners: z.string().array(),
	applications: z.object({
		timeout: z.number(),
		channel: z.string(),
		questions: z.array(z.string())
	}),
	interviews: z.object({
		notification: z.string(),
		role: z.string(),
		channel: z.string(),
		private: z.boolean()
	}),
	whitelist_manager: z.object({
		servers: z.array(z.string()),
		inactivity: z.object({
			remove_inactive_player_after: z.object({
				time: z.number(),
				unit: z.string()
			}),
			clean_whitelist_every: z.object({ time: z.number(), unit: z.string() })
		})
	}),
	database: z.object({
		host: z.string().ip(),
		port: z.number(),
		user: z.string(),
		password: z.string(),
		name: z.string()
	})
});
