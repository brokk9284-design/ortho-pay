import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { sendKycApprovedEmail, sendKycRejectedEmail } from "@/lib/email/service";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const supabase = await createSupabaseServerClient();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("kyc_documents")
      .select(`
        *,
        user:profiles!user_id(id, siva_tag, name, email, country, kyc_status)
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: documents, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ documents });
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
    const { document_id, status, rejection_reason } = body;

    if (!document_id || !status) {
      return NextResponse.json(
        { error: "document_id and status are required" },
        { status: 400 }
      );
    }

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "status must be approved or rejected" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    const { data: doc, error: docError } = await supabase
      .from("kyc_documents")
      .update({
        status,
        reviewed_by: admin.admin_id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("document_id", document_id)
      .select()
      .single();

    if (docError) {
      return NextResponse.json({ error: docError.message }, { status: 500 });
    }

    if (status === "approved") {
      const admin = await createSupabaseAdminClient();
      const { error: profileUpdateError } = await admin
        .from("profiles")
        .update({ kyc_status: "verified" })
        .eq("id", doc.user_id);

      if (profileUpdateError) {
        console.error("[kyc-manage] Failed to update profile kyc_status:", profileUpdateError.message);
        return NextResponse.json(
          { error: "Failed to verify user profile: " + profileUpdateError.message },
          { status: 500 }
        );
      }
    } else if (status === "rejected") {
      const admin = await createSupabaseAdminClient();
      const { data: remainingDocs } = await admin
        .from("kyc_documents")
        .select("document_id")
        .eq("user_id", doc.user_id)
        .eq("status", "pending");

      if (!remainingDocs || remainingDocs.length === 0) {
        const { error: profileUpdateError } = await admin
          .from("profiles")
          .update({ kyc_status: "rejected" })
          .eq("id", doc.user_id);

        if (profileUpdateError) {
          console.error("[kyc-manage] Failed to update profile kyc_status:", profileUpdateError.message);
        }
      }
    }

    await supabase.from("notifications").insert({
      user_id: doc.user_id,
      title: status === "approved" ? "KYC Approved" : "KYC Rejected",
      message:
        status === "approved"
          ? "Your identity verification has been approved. You can now send and receive payments."
          : `Your KYC document was rejected. ${rejection_reason || "Please submit a new document."}`,
      type: "kyc",
    });

    await supabase.from("audit_logs").insert({
      actor_id: admin.admin_id,
      actor_type: "admin",
      action: `KYC ${status}`,
      table_name: "kyc_documents",
      record_id: document_id,
      new_value: { status, rejection_reason },
    });

    // Send email notification to user
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("name, email")
      .eq("id", doc.user_id)
      .single();

    if (userProfile?.email) {
      if (status === "approved") {
        await sendKycApprovedEmail(userProfile.email, userProfile.name || "User");
      } else {
        await sendKycRejectedEmail(
          userProfile.email,
          userProfile.name || "User",
          rejection_reason || "The document was unclear, expired, or did not match your account details."
        );
      }
    }

    return NextResponse.json({ document: doc });
  } catch (err) {
    if (err instanceof Response) {
      return NextResponse.json({ error: "Admin access required" }, { status: err.status });
    }
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
}
