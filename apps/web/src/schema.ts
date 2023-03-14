import * as z from "zod";

export const BotSchema = z.object({
  prefix: z.string(),
  console_channel: z.string(),
  bot_token: z.string(),
  ws_port: z.number().int().positive(),
  guild_id: z.string(),
  client_id: z.string().optional(),
  status: z.enum(["online", "idle", "dnd", "invisible"]),
});

export const JoinSchema = z.object({
  channel: z.string(),
  message: z.string(),
});

export const AcceptSchema = z.object({
  channel: z.string(),
  message: z.string(),
});

export const RolesSchema = z.record(z.string());

export const AdminsSchema = z.array(z.string());

export const ApplicationsSchema = z
  .object({
    enabled: z.boolean().default(false),
    channel: z.string().optional(),
    questions: z.array(z.string()).optional(),
  })
  .refine(
    (data) =>
      !data.enabled ||
      (data.channel && data.questions && data.questions.length > 0),
    {
      message: "If 'enabled', 'channel' and 'questions' are required.",
    }
  );

export const InterviewsSchema = z
  .object({
    enabled: z.boolean().default(false),
    notification: z.string().optional(),
    channel: z.string().optional(),
    role: z.string().optional(),
    private: z.boolean().optional().default(false),
  })
  .refine(
    (data) =>
      !data.enabled ||
      (data.channel && data.role && data.notification && data.private),
    {
      message:
        "If 'enabled', 'channel', 'role' and 'notification' are required.",
    }
  );

export const WhitelistManagerSchema = z.object({
  enabled: z.boolean(),
});

export const ActivityManagerSchema = z.object({
  enabled: z.boolean().default(false),
  message: z.string(),
  pardon_role: z.string(),
  remove_inactive_player_after_days: z.number().int().positive(),
  grace_period: z.number().int().positive(),
  timezone: z.string(),
  cron: z.string(),
});

export const DatabaseSchema = z.object({
  type: z.enum(["mysql", "mariadb", "postgresql", "sqlite"]),
  host: z.string(),
  port: z.number().int().positive(),
  user: z.string(),
  password: z.string(),
  database: z.string(),
});

export const schema = z.object({
  bot: BotSchema,
  join: JoinSchema,
  accept: AcceptSchema,
  roles: RolesSchema,
  admins: AdminsSchema,
  applications: ApplicationsSchema,
  interviews: InterviewsSchema,
  whitelist_manager: WhitelistManagerSchema,
  activity_manager: ActivityManagerSchema,
  database: DatabaseSchema,
});

export type BotConfig = z.infer<typeof BotSchema>;
export type JoinConfig = z.infer<typeof JoinSchema>;
export type AcceptConfig = z.infer<typeof AcceptSchema>;
export type RolesConfig = z.infer<typeof RolesSchema>;
export type AdminsConfig = z.infer<typeof AdminsSchema>;
export type ApplicationsConfig = z.infer<typeof ApplicationsSchema>;
export type InterviewsConfig = z.infer<typeof InterviewsSchema>;
export type WhitelistManagerConfig = z.infer<typeof WhitelistManagerSchema>;
export type ActivityManagerConfig = z.infer<typeof ActivityManagerSchema>;
export type DatabaseConfig = z.infer<typeof DatabaseSchema>;

export type Config = z.infer<typeof schema>;
