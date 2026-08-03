import 'dotenv/config';
import { DataSource } from 'typeorm';

/**
 * Standalone DataSource for the TypeORM CLI (migration:generate / run / revert).
 * The CLI runs OUTSIDE Nest, so it can't use ConfigService — it loads .env
 * itself (dotenv) and points at the entities + migrations directly.
 * (The running app keeps using TypeOrmModule.forRootAsync in app.module.ts;
 * this file exists only for the migration commands.)
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
