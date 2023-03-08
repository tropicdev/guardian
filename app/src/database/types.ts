import type { ColumnType } from 'kysely';

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U> ? ColumnType<S, I | undefined, U> : ColumnType<T, T | undefined, T>;

export interface Application {
	id: string;
	applicant_id: string;
	content: string;
	status: Generated<'ACCEPTED' | 'DENIED' | 'PENDING'>;
	submitted_at: Generated<Date>;
	updated_at: Generated<Date>;
}

export interface ApplicationMeta {
	id: string;
	admin_id: string;
	response: string;
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
	joined_at: Generated<Date>;
	updated_at: Generated<Date>;
}

export interface Server {
	id: Generated<string>;
	name: Generated<string>;
	ip_address: string;
	token: string;
}

export interface Session {
	id: Generated<string>;
	server_id: string;
	member_id: string;
	session_start: Generated<Date>;
	session_end: Generated<Date>;
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
