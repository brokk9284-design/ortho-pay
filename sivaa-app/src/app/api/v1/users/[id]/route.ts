import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const supabase = await createSupabaseServerClient();

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data: wallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", id)
      .single();

    return NextResponse.json({ profile, wallet });
  } catch (err) {
    if (err instanceof Response) {
      return NextResponse.json({ error: "Admin access required" }, { status: err.status });
    }
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { admin } = await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { kyc_status, country } = body;

    const updates: Record<string, unknown> = {};
    if (kyc_status) updates.kyc_status = kyc_status;
    if (country) updates.country = country;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    const { data: profile, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.from("audit_logs").insert({
      actor_id: admin.admin_id,
      actor_type: "admin",
      action: "Update profile",
      table_name: "profiles",
      record_id: id,
      new_value: updates,
    });

    return NextResponse.json({ profile });
  } catch (err) {
    if (err instanceof Response) {
      return NextResponse.json({ error: "Admin access required" }, { status: err.status });
    }
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
}
