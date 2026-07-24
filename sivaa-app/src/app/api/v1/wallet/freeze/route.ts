import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { sendWalletStatusEmail } from "@/lib/email/service";

export async function POST(request: NextRequest) {
  try {
    const { admin } = await requireAdmin();
    const body = await request.json();
    const { wallet_id, status } = body;

    if (!wallet_id || !status) {
      return NextResponse.json(
        { error: "wallet_id and status are required" },
        { status: 400 }
      );
    }

    if (!["active", "frozen", "suspended"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be active, frozen, or suspended" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    const { data: wallet, error } = await supabase
      .from("wallets")
      .update({ status })
      .eq("wallet_id", wallet_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log to audit
    await supabase.from("audit_logs").insert({
      actor_id: admin.admin_id,
      actor_type: "admin",
      action: `Wallet ${status}`,
      table_name: "wallets",
      record_id: wallet_id,
      new_value: { status },
    });

    // Send email notification to user
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("name, email")
      .eq("id", wallet.user_id)
      .single();

    if (userProfile?.email) {
      await sendWalletStatusEmail(
        userProfile.email,
        userProfile.name || "User",
        status as "frozen" | "suspended" | "active"
      );
    }

    // Create in-app notification
    await supabase.from("notifications").insert({
      user_id: wallet.user_id,
      title: status === "active" ? "Wallet reactivated" : status === "frozen" ? "Wallet frozen" : "Account suspended",
      message:
        status === "active"
          ? "Your wallet has been reactivated. You can now send and receive payments."
          : status === "frozen"
            ? "Your wallet has been frozen. Please contact support if you believe this is an error."
            : "Your account has been suspended. Please contact support to resolve this issue.",
      type: "system",
    });

    return NextResponse.json({
      message: `Wallet ${status}`,
      wallet,
    });
  } catch (err) {
    if (err instanceof Response) {
      return NextResponse.json({ error: "Admin access required" }, { status: err.status });
    }
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
}
