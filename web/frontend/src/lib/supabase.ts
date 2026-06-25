import { createBrowserClient } from "@supabase/ssr";

type BrowserClient = ReturnType<typeof createBrowserClient>;

let _client: BrowserClient | undefined;

/**
 * Safe stand-in used when Supabase env vars are absent (e.g. mock mode /
 * frontend-only testing with no backend). It mimics the auth surface the
 * app touches so pages don't crash on mount.
 */
function stubClient(): BrowserClient {
  const mockUser = {
    id: "mock-user",
    email: "thai.nguyen@example.com",
    user_metadata: { onboarding_completed: true, full_name: "Nguyễn Đức Thái" },
  };
  const mockSession = { access_token: "mock-token", user: mockUser };
  const auth = {
    getUser: async () => ({ data: { user: mockUser }, error: null }),
    getSession: async () => ({ data: { session: mockSession }, error: null }),
    refreshSession: async () => ({ data: { session: mockSession }, error: null }),
    updateUser: async () => ({ data: { user: mockUser }, error: null }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    signInWithPassword: async () => ({ data: { user: mockUser, session: mockSession }, error: null }),
    signUp: async () => ({ data: { user: mockUser, session: mockSession }, error: null }),
  };
  return { auth } as unknown as BrowserClient;
}

export function createClient(): BrowserClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return stubClient();

  if (typeof window === "undefined") {
    return createBrowserClient(url, key);
  }
  if (!_client) {
    _client = createBrowserClient(url, key);
  }
  return _client;
}
