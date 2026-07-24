import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireAuth() {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  const supabase = await createSupabaseServerClient();

  const { data: admin } = await supabase
    .from("admins")
    .select("*")
    .eq("profile_id", user.id)
    .eq("is_active", true)
    .single();

  if (!admin) {
    throw new Response(JSON.stringify({ error: "Admin access required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  return { user, admin };
}

export async function requireSuperAdmin() {
  const { user, admin } = await requireAdmin();
  if (admin.role !== "super_admin") {
    throw new Response(JSON.stringify({ error: "Super admin access required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  return { user, admin };
}
