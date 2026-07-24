import { readFileSync } from "fs";
import { join } from "path";
import pg from "pg";
import { config } from "dotenv";

config();

const { Pool } = pg;

const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

if (!DB_PASSWORD || !SUPABASE_URL) {
  console.error("Missing SUPABASE_DB_PASSWORD or NEXT_PUBLIC_SUPABASE_URL in .env");
  process.exit(1);
}

// Extract project ref from URL: https://ybdxsatkhccsdgvoswhu.supabase.co → ybdxsatkhccsdgvoswhu
const projectRef = SUPABASE_URL.replace("https://", "").split(".")[0];
const CONNECTION_STRING = `postgresql://postgres.${projectRef}:${DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

async function runSql() {
  const sqlPath = join(import.meta.dirname, "..", "..", "database_init_sivaa.sql");
  const sql = readFileSync(sqlPath, "utf-8");

  console.log("Running database init SQL via pg...");
  console.log("SQL length:", sql.length, "chars\n");

  const pool = new Pool({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    const client = await pool.connect();
    console.log("Connected to database");

    await client.query(sql);
    console.log("SQL executed successfully!");

    client.release();
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

runSql().catch(console.error);
