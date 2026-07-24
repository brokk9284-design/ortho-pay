import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { uploadFile, isStorageConfigured } from "@/lib/github-storage";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    if (!isStorageConfigured()) {
      return NextResponse.json(
        { error: "File storage is not configured. Contact support." },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const category = formData.get("category") as string | null;
    const customName = formData.get("custom_name") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!category || !["kyc", "receipts", "profile"].includes(category)) {
      return NextResponse.json(
        { error: "category must be one of: kyc, receipts, profile" },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const result = await uploadFile(
      user.id,
      category as "kyc" | "receipts" | "profile",
      file.name,
      fileBuffer,
      customName || undefined
    );

    return NextResponse.json({
      path: result.path,
      url: result.url,
      size: result.size,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    if (message.includes("not configured")) {
      return NextResponse.json({ error: message }, { status: 503 });
    }
    if (message.includes("not allowed") || message.includes("exceeds") || message.includes("Invalid")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
