import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function createAdminUser() {
  const email = "gonnyzalowski@gmail.com";
  const password = "Americana12";
  const name = "gonnyz";
  const sivaTag = "gonnyz";

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    if (authError.message.includes("already been registered")) {
      console.log("User already exists, ensuring admin status...");
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existing = existingUsers?.users?.find((u) => u.email === email);
      if (existing) {
        await ensureAdmin(existing.id, sivaTag, name, email);
      }
    } else {
      console.error("Auth error:", authError.message);
    }
    return;
  }

  console.log("Auth user created:", authData.user.id);
  await ensureAdmin(authData.user.id, sivaTag, name, email);
}

async function ensureAdmin(userId: string, sivaTag: string, name: string, email: string) {
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    siva_tag: sivaTag,
    name,
    email,
    country: "US",
    kyc_status: "verified",
  }, { onConflict: "id" });

  if (profileError) {
    console.error("Profile error:", profileError.message);
  } else {
    console.log("Profile ready with tag: $" + sivaTag);
  }

  const { error: walletError } = await supabase.from("wallets").upsert({
    user_id: userId,
    total_sent: 0,
    total_received: 0,
    locked_balance: 0,
    status: "active",
  }, { onConflict: "user_id" });

  if (walletError) {
    console.error("Wallet error:", walletError.message);
  } else {
    console.log("Wallet ready");
  }

  const { error: adminError } = await supabase.from("admins").upsert({
    profile_id: userId,
    role: "super_admin",
    is_active: true,
  }, { onConflict: "profile_id" });

  if (adminError) {
    console.error("Admin error:", adminError.message);
  } else {
    console.log("Admin role created: super_admin");
  }

  console.log("\nDone! User can login at /login with:");
  console.log("Email: " + email);
  console.log("Password: Americana12");
}

createAdminUser();
