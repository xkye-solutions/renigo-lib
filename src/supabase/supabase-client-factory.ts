import {
  type CookieOptions,
  createBrowserClient as supabaseCreateBrowserClient,
  createServerClient as supabaseCreateServerClient,
} from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

export class SupabaseClientFactory {
  // @deprecated: Will remove in future release
  static createBrowserClient() {
    return supabaseCreateBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    );
  }

  static async createAdminClient() {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.SUPABASE_SERVICE_ROLE as string
    );
  }

  static async createAnonClient() {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    );
  }

  static async createServerClient() {
    const { cookies } = await import('next/headers');

    const cookieStore = await cookies();

    return supabaseCreateServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(
            cookies: { name: string; value: string; options: CookieOptions }[]
          ) {
            try {
              cookies.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch (error) {
              console.error('Failed to set cookies', error);
            }
          },
        },
      }
    );
  }
}
