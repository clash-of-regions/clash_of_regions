import mysql from "mysql2/promise";

export interface MySQLConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  port?: number;
}

let pool: mysql.Pool | null = null;

export function initMySQL(config: MySQLConfig) {
  pool = mysql.createPool({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database,
    port: config.port ?? 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
  return pool;
}

export function getPool(): mysql.Pool {
  if (!pool) {
    throw new Error("MySQL pool not initialized");
  }
  return pool;
}
