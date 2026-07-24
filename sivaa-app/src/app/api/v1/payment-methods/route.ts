import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: methods, error } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ payment_methods: methods });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { admin } = await requireAdmin();
    const body = await request.json();
    const {
      code,
      display_name,
      icon_key,
      fee_percentage,
      fee_fixed,
      min_amount,
      max_amount,
      daily_limit,
      monthly_limit,
      config,
      sort_order,
    } = body;

    if (!code || !display_name || !icon_key) {
      return NextResponse.json(
        { error: "code, display_name, and icon_key are required" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    const { data: method, error } = await supabase
      .from("payment_methods")
      .insert({
        code,
        display_name,
        icon_key,
        fee_percentage: fee_percentage || 0,
        fee_fixed: fee_fixed || 0,
        min_amount: min_amount || 0,
        max_amount: max_amount || null,
        daily_limit: daily_limit || null,
        monthly_limit: monthly_limit || null,
        config: config || {},
        sort_order: sort_order || 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.from("audit_logs").insert({
      actor_id: admin.admin_id,
      actor_type: "admin",
      action: "Create payment method",
      table_name: "payment_methods",
      record_id: method.method_id,
      new_value: { code, display_name, fee_percentage, fee_fixed },
    });

    return NextResponse.json({ method });
  } catch (err) {
    if (err instanceof Response) {
      return NextResponse.json({ error: "Admin access required" }, { status: err.status });
    }
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { admin } = await requireAdmin();
    const body = await request.json();
    const { method_id, ...updates } = body;

    if (!method_id) {
      return NextResponse.json({ error: "method_id is required" }, { status: 400 });
    }

    const allowedFields = [
      "display_name",
      "icon_key",
      "fee_percentage",
      "fee_fixed",
      "min_amount",
      "max_amount",
      "daily_limit",
      "monthly_limit",
      "config",
      "is_active",
      "sort_order",
    ];

    const cleanUpdates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in updates) cleanUpdates[key] = updates[key];
    }

    if (Object.keys(cleanUpdates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    const { data: method, error } = await supabase
      .from("payment_methods")
      .update(cleanUpdates)
      .eq("method_id", method_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.from("audit_logs").insert({
      actor_id: admin.admin_id,
      actor_type: "admin",
      action: "Update payment method",
      table_name: "payment_methods",
      record_id: method_id,
      new_value: cleanUpdates,
    });

    return NextResponse.json({ method });
  } catch (err) {
    if (err instanceof Response) {
      return NextResponse.json({ error: "Admin access required" }, { status: err.status });
    }
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { admin } = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const methodId = searchParams.get("method_id");

    if (!methodId) {
      return NextResponse.json({ error: "method_id is required" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    const { data: existing } = await supabase
      .from("payment_methods")
      .select("method_id, code, display_name")
      .eq("method_id", methodId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Payment method not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("payment_methods")
      .delete()
      .eq("method_id", methodId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.from("audit_logs").insert({
      actor_id: admin.admin_id,
      actor_type: "admin",
      action: "Delete payment method",
      table_name: "payment_methods",
      record_id: methodId,
      old_value: { code: existing.code, display_name: existing.display_name },
    });

    return NextResponse.json({ message: "Payment method deleted" });
  } catch (err) {
    if (err instanceof Response) {
      return NextResponse.json({ error: "Admin access required" }, { status: err.status });
    }
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
}
