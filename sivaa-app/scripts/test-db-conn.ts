import { config } from "dotenv";
import pg from "pg";

config();

const { Pool } = pg;

const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const projectRef = SUPABASE_URL.replace("https://", "").split(".")[0];

const candidates = [
  { name: "Pooler us-east-1 :6543", conn: `postgresql://postgres.${projectRef}:${DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres` },
  { name: "Pooler us-east-1 :5432", conn: `postgresql://postgres.${projectRef}:${DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:5432/postgres` },
  { name: "Pooler eu-west-1 :6543", conn: `postgresql://postgres.${projectRef}:${DB_PASSWORD}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres` },
  { name: "Pooler eu-west-1 :5432", conn: `postgresql://postgres.${projectRef}:${DB_PASSWORD}@aws-0-eu-west-1.pooler.supabase.com:5432/postgres` },
  { name: "Pooler us-west-1 :6543", conn: `postgresql://postgres.${projectRef}:${DB_PASSWORD}@aws-0-us-west-1.pooler.supabase.com:6543/postgres` },
  { name: "Direct :5432", conn: `postgresql://postgres:${DB_PASSWORD}@db.${projectRef}.supabase.co:5432/postgres` },
];

async function tryConnect(name: string, connStr: string) {
  const pool = new Pool({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });
  try {
    const client = await pool.connect();
    const res = await client.query("SELECT 1 as ok");
    console.log(`✓ ${name} — SUCCESS`);
    client.release();
    return true;
  } catch (err: any) {
    console.log(`✗ ${name} — ${err.code || err.message}`);
    return false;
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log("Project ref:", projectRef);
  console.log("Testing connections...\n");

  for (const c of candidates) {
    const ok = await tryConnect(c.name, c.conn);
    if (ok) {
      console.log("\nWorking connection string:");
      console.log(c.conn);
      break;
    }
  }
}

main();
