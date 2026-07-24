import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function test() {
  console.log("URL:", SUPABASE_URL);
  console.log("Key length:", ANON_KEY?.length);

  const { data, error } = await supabase.auth.signUp({
    email: "testuser9234@example.com",
    password: "test12345",
  });

  console.log("\nsignUp result:");
  console.log("data:", JSON.stringify(data, null, 2));
  console.log("error:", error);
  console.log("error type:", typeof error);
  console.log("error keys:", error ? Object.keys(error) : "null");
  console.log("error.message:", error?.message);
  console.log("error.name:", error?.name);
  console.log("error.status:", error?.status);
}

test().catch(console.error);
