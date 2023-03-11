import type { ColumnType } from 'kysely';

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U> ? ColumnType<S, I | undefined, U> : ColumnType<T, T | undefined, T>;

export interface Application {
	id: string;
	applicant_id: string;
	content: string;
	status: Generated<'ACCEPTED' | 'DENIED' | 'PENDING' | 'DELETED'>;
	submitted_at: Generated<Date>;
	updated_at: Generated<Date>;
}

export interface ApplicationMeta {
	id: string;
	admin_id: string;
	response: string;
	deleted: Generated<boolean>;
	responded_at: Generated<Date>;
}

export interface Interview {
	thread_id: string;
	application_id: string;
	status: Generated<'ACCEPTED' | 'DENIED' | 'ONGOING'>;
	created_at: Generated<Date>;
	updated_at: Generated<Date>;
}

export interface Member {
	id: Generated<string>;
	discord_id: string;
	mojang_id: string;
	status: Generated<'ACTIVE' | 'LEFT' | 'BANNED'>;
	grace_period_end: Generated<Date>;
	joined_at: Generated<Date>;
	updated_at: Generated<Date>;
}

export interface Server {
	id: Generated<string>;
	name: Generated<string>;
	token: Generated<string>;
}

export interface Session {
	id: Generated<string>;
	server_id: string;
	member_id: string;
	session_start: Generated<Date>;
	session_end: Date | null;
	invalid: Generated<number | null>;
}

export interface DB {
	application: Application;
	application_meta: ApplicationMeta;
	interview: Interview;
	member: Member;
	server: Server;
	session: Session;
}
