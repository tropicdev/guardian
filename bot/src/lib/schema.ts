// @ts-check
import { z } from 'zod';

export const configSchema = z.object({
	prefix: z.string().default('!'),
	console_channel: z.string().optional(),
	bot_token: z.string(),
	api_token: z.string().optional(),
	api_host: z.string().ip().optional(),
	status: z.string().optional(),
	join_channel: z.string().optional(),
	join_message: z.string().optional(),
	accept_channel: z.string().optional(),
	accept_message: z.string().optional(),
	member_role: z.string().optional(),
	applications: z
		.object({
			enabled: z.boolean(),
			timeout: z.number(),
			channel: z.string(),
			questions: z.array(z.string())
		})
		.optional(),
	interviews: z
		.object({
			enabled: z.boolean(),
			notification: z.string(),
			role: z.string(),
			channel: z.string(),
			private: z.boolean()
		})
		.optional(),
	whitelist_manager: z
		.object({
			enabled: z.boolean(),
			servers: z.array(z.string()),
			inactivity: z.object({
				enabled: z.boolean(),
				remove_inactive_player_after: z.object({
					time: z.number(),
					unit: z.string()
				}),
				clean_whitelist_every: z.object({ time: z.number(), unit: z.string() })
			})
		})
		.optional()
});
