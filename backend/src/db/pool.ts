import { createPool, Pool } from "mysql2/promise";

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

let pool: Pool | null = null;

export const getPool = (): Pool | null => {
  if (pool) return pool;

  if (!DB_HOST || !DB_USER || !DB_NAME) {
    return null;
  }

  pool = createPool({
    host: DB_HOST,
    port: DB_PORT ? Number(DB_PORT) : 3306,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
  });

  return pool;
};
