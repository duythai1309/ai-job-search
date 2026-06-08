import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("[v0] Missing Supabase environment variables");
      return supabaseResponse;
    }

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    let authUser: typeof user | null = null;
    const { data: { user }, error } = await supabase.auth.getUser();
    authUser = user;
    
    if (error) {
      // Auth session missing is expected for unauthenticated users - not an error
      if (!error.message.includes("session missing") && !error.message.includes("invalid") && !error.message.includes("expired")) {
        console.error("[v0] Auth error:", error.message);
      }
      // Continue without user - let routing handle unauthenticated access
      authUser = null;
    }

    const { pathname } = request.nextUrl;

    // Public/auth pages that don't require authentication
    const publicPaths = ["/", "/auth/login", "/auth/register"];
    const isPublicPath = publicPaths.includes(pathname);
    
    // Protected pages that require authentication  
    const isProtectedPath = !isPublicPath && pathname.startsWith("/(app)") || pathname.startsWith("/dashboard") || pathname.startsWith("/analytics") || pathname.startsWith("/applications") || pathname.startsWith("/chat");

    // If user is not authenticated and trying to access protected page, redirect to login
    if (!authUser && isProtectedPath) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      return NextResponse.redirect(url);
    }

    // If user is authenticated and trying to access auth pages, redirect to dashboard
    if (authUser && (pathname === "/auth/login" || pathname === "/auth/register")) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  } catch (error) {
    console.error("[v0] Middleware error:", error instanceof Error ? error.message : String(error));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
