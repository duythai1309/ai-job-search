import { createBrowserClient } from "@supabase/ssr";

type BrowserClient = ReturnType<typeof createBrowserClient>;

let _client: BrowserClient | undefined;

/**
 * Safe stand-in used when Supabase env vars are absent (e.g. mock mode /
 * frontend-only testing with no backend). It mimics the auth surface the
 * app touches so pages don't crash on mount.
 */
function stubClient(): BrowserClient {
  const noUser = { data: { user: null }, error: null };
  const auth = {
    getUser: async () => noUser,
    getSession: async () => ({ data: { session: null }, error: null }),
    refreshSession: async () => ({ data: { session: null }, error: null }),
    updateUser: async () => noUser,
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
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
