import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /dashboard and /admin routes
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    try {
      const response = NextResponse.next({
        request: {
          headers: request.headers,
        },
      });

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error("Middleware: Missing Supabase env vars");
        return NextResponse.redirect(new URL("/login", request.url));
      }

      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      });

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        const redirectUrl = new URL("/login", request.url);
        redirectUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(redirectUrl);
      }

      // Admin-specific check
      if (pathname.startsWith("/admin")) {
        const { data: admin } = await supabase
          .from("admins")
          .select("profile_id, is_active")
          .eq("profile_id", user.id)
          .eq("is_active", true)
          .single();

        if (!admin) {
          const redirectUrl = new URL("/dashboard", request.url);
          redirectUrl.searchParams.set("error", "admin_required");
          return NextResponse.redirect(redirectUrl);
        }
      }

      return response;
    } catch (err) {
      console.error("Middleware error:", err);
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
