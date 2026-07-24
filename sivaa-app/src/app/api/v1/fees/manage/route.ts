import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { admin } = await requireSuperAdmin();
    const body = await request.json();
    const { minimum_amount, maximum_amount, percentage } = body;

    if (minimum_amount === undefined || percentage === undefined) {
      return NextResponse.json(
        { error: "minimum_amount and percentage are required" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    const { data: rule, error } = await supabase
      .from("fee_rules")
      .insert({
        minimum_amount,
        maximum_amount: maximum_amount || null,
        percentage,
        active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.from("audit_logs").insert({
      actor_id: admin.admin_id,
      actor_type: "admin",
      action: "Create fee rule",
      table_name: "fee_rules",
      record_id: rule.rule_id,
      new_value: { minimum_amount, maximum_amount, percentage },
    });

    return NextResponse.json({ rule });
  } catch (err) {
    if (err instanceof Response) {
      return NextResponse.json({ error: "Super admin access required" }, { status: err.status });
    }
    return NextResponse.json({ error: "Super admin access required" }, { status: 403 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { admin } = await requireSuperAdmin();
    const body = await request.json();
    const { rule_id, percentage, active } = body;

    if (!rule_id) {
      return NextResponse.json({ error: "rule_id is required" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (percentage !== undefined) updates.percentage = percentage;
    if (active !== undefined) updates.active = active;

    const supabase = await createSupabaseServerClient();

    const { data: rule, error } = await supabase
      .from("fee_rules")
      .update(updates)
      .eq("rule_id", rule_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.from("audit_logs").insert({
      actor_id: admin.admin_id,
      actor_type: "admin",
      action: "Update fee rule",
      table_name: "fee_rules",
      record_id: rule_id,
      new_value: updates,
    });

    return NextResponse.json({ rule });
  } catch (err) {
    if (err instanceof Response) {
      return NextResponse.json({ error: "Super admin access required" }, { status: err.status });
    }
    return NextResponse.json({ error: "Super admin access required" }, { status: 403 });
  }
}
