import { Kysely, MysqlDialect } from 'kysely';
import type { DB } from './types';
import { createPool } from 'mysql2';
import { CONFIG } from '../lib/setup';

export const db = new Kysely<DB>({
	dialect: new MysqlDialect({
		pool: async () =>
			createPool({
				host: CONFIG.database.host,
				port: CONFIG.database.port,
				user: CONFIG.database.user,
				password: CONFIG.database.password,
				database: CONFIG.database.name
			})
	})
});
