import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Shared helper used by server functions that need the publishable key.
// Strips the "Bearer <publishable-key>" Authorization header that the Supabase
// client auto-adds (new opaque keys must not be sent as a bearer JWT) and
// sets the required `apikey` header instead.
export function makeSupabaseFetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) {
      new Headers(init.headers).forEach((v, k) => headers.set(k, v));
    }
    if (
      (key.startsWith("sb_publishable_") ||
        key.startsWith("sb_secret_") ||
        key.startsWith("sb_")) &&
      headers.get("Authorization") === `Bearer ${key}`
    ) {
      headers.delete("Authorization");
    }
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };
}

// Module-level cache — one client for the lifetime of the server process.
let _client: ReturnType<typeof createClient<Database>> | undefined;

export function getPublishableClient(): ReturnType<typeof createClient<Database>> {
  if (_client) return _client;

  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  const url = process.env["SUPABASE_URL"];
  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env and fill it in.",
    );
  }

  _client = createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: makeSupabaseFetch(key),
    },
  });

  return _client;
}
