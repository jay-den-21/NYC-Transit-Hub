import { getPool } from "./pool.js";
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const initializeDatabase = async () => {
    const pool = getPool();
    if (!pool) {
      console.error("Database pool is not available, skipping initialization.");
      return;
    }
  
    try {
      const initSqlPath = path.resolve(__dirname, "../../db/init.sql");
      const initSql = await fs.readFile(initSqlPath, "utf-8");
      const queries = initSql.split(';').filter(query => query.trim() !== '');
  
      for (const query of queries) {
        await pool.query(query);
      }
  
      console.log("Database initialized successfully.");
    } catch (error) {
      console.error("Error initializing database:", error);
      // Exit the process if the database cannot be initialized
      process.exit(1);
    }
};
