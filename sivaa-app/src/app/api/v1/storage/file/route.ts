import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { getFileUrl, listFiles, isStorageConfigured } from "@/lib/github-storage";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    if (!isStorageConfigured()) {
      return NextResponse.json(
        { error: "File storage is not configured." },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");
    const listUserId = searchParams.get("user_id");
    const category = searchParams.get("category") as "kyc" | "receipts" | "profile" | null;
    const redirect = searchParams.get("redirect") !== "false";

    // If path is provided, return the file URL or redirect to it
    if (path) {
      // Verify the user owns this file or is admin
      const pathUserId = path.split("/")[1];
      let isAdmin = false;
      try {
        await requireAdmin();
        isAdmin = true;
      } catch {
        isAdmin = false;
      }

      if (pathUserId !== user.id && !isAdmin) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      const url = await getFileUrl(path);
      if (redirect) {
        return NextResponse.redirect(url, { status: 302 });
      }
      return NextResponse.json({ url });
    }

    // If listing files
    if (listUserId) {
      let isAdmin = false;
      try {
        await requireAdmin();
        isAdmin = true;
      } catch {
        isAdmin = false;
      }

      if (listUserId !== user.id && !isAdmin) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      const files = await listFiles(listUserId, category || undefined);
      return NextResponse.json({ files });
    }

    return NextResponse.json({ error: "Provide path or user_id parameter" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed";
    if (message.includes("not found")) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
