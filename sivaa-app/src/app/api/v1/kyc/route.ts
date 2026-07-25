import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = await createSupabaseServerClient();

    const { data: documents, error } = await supabase
      .from("kyc_documents")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ documents });
  } catch (err) {
    if (err instanceof Response) {
      return NextResponse.json({ error: "Unauthorized" }, { status: err.status });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const contentType = request.headers.get("content-type") || "";
    let document_type: string;
    let file_url: string;
    let uploadedPath: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      document_type = formData.get("document_type") as string;

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }
      if (!document_type) {
        return NextResponse.json({ error: "document_type is required" }, { status: 400 });
      }

      const validTypes = ["passport", "drivers_license", "utility_bill", "bank_statement"];
      if (!validTypes.includes(document_type)) {
        return NextResponse.json(
          { error: `document_type must be one of: ${validTypes.join(", ")}` },
          { status: 400 }
        );
      }

      const { uploadFile, buildKycFilename, isStorageConfigured } = await import("@/lib/github-storage");

      if (!isStorageConfigured()) {
        return NextResponse.json(
          { error: "File storage is not configured. Contact support." },
          { status: 503 }
        );
      }

      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const filename = buildKycFilename(document_type, file.name);

      const result = await uploadFile(user.id, "kyc", file.name, fileBuffer, filename);
      file_url = result.path;
      uploadedPath = result.path;
    } else {
      const body = await request.json();
      document_type = body.document_type;
      file_url = body.file_url;
    }

    if (!document_type || !file_url) {
      return NextResponse.json(
        { error: "document_type and file_url (or file upload) are required" },
        { status: 400 }
      );
    }

    const validTypes = ["passport", "drivers_license", "utility_bill", "bank_statement"];
    if (!validTypes.includes(document_type)) {
      return NextResponse.json(
        { error: `document_type must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    const { data: doc, error } = await supabase
      .from("kyc_documents")
      .insert({
        user_id: user.id,
        document_type,
        file_url,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const adminClient = await createSupabaseAdminClient();
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({ kyc_status: "pending" })
      .eq("id", user.id);

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ document: doc });
  } catch (err) {
    if (err instanceof Response) {
      return NextResponse.json({ error: "Unauthorized" }, { status: err.status });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
