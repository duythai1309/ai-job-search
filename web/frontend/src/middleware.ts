import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Mock mode: skip all auth gating so the whole UI is browsable with
  // sample data, no backend or Supabase login required.
  if (process.env.NEXT_PUBLIC_USE_MOCK === "1") {
    return NextResponse.next({ request });
  }

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

    // App pages (require auth + completed onboarding)
    const APP_PREFIXES = ["/dashboard", "/analytics", "/applications", "/jobs", "/cv", "/profile"];
    const isAppPath = APP_PREFIXES.some((p) => pathname.startsWith(p));
    const isProtectedPath = isAppPath || pathname.startsWith("/onboarding");
    const isAuthPage = ["/auth/login", "/auth/register", "/login", "/register"].includes(pathname);

    // If not authenticated, redirect to login for all protected paths
    if (!authUser && isProtectedPath) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      return NextResponse.redirect(url);
    }

    // If authenticated and on an auth page, redirect based on onboarding status
    if (authUser && isAuthPage) {
      const url = request.nextUrl.clone();
      url.pathname = authUser.user_metadata?.onboarding_completed ? "/dashboard" : "/onboarding";
      return NextResponse.redirect(url);
    }

    // If authenticated but onboarding not done, block access to app pages
    if (authUser && isAppPath && !authUser.user_metadata?.onboarding_completed) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
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
