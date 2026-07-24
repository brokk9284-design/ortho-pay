import { readFileSync } from "fs";
import { join } from "path";
import { config } from "dotenv";

config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

async function runSql() {
  const sqlPath = join(import.meta.dirname, "..", "..", "database_init_sivaa.sql");
  const sql = readFileSync(sqlPath, "utf-8");

  console.log("Running database init SQL via Supabase REST...");
  console.log("SQL length:", sql.length, "chars\n");

  const res = await fetch(`${SUPABASE_URL}/pg/query`, {
    method: "POST",
    headers: {
      "apikey": SERVICE_KEY,
      "Authorization": `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  if (res.ok) {
    const data = await res.text();
    console.log("Success:", data);
  } else {
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  }
}

runSql().catch(console.error);
