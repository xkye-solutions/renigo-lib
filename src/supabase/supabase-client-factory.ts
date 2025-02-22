import {
  type CookieOptions,
  createServerClient as supabaseCreateServerClient,
} from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

/**
 * @deprecated Will be removed in future release.
 */
export class SupabaseClientFactory {
  private static readonly URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;

  private static readonly SERVICE_ROLE = process.env
    .SUPABASE_SERVICE_ROLE as string;

  private static readonly ANON_KEY = process.env
    .NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

  /**
   * @deprecated Will be removed in future release.
   * Use SupabaseAdminClientFactory instead.
   */
  static createAdminClient() {
    return createClient(this.URL, this.SERVICE_ROLE);
  }

  /**
   * @deprecated Will be removed in future release.
   * Use SupabaseAnonClientFactory instead.
   */
  static createAnonClient() {
    return createClient(this.URL, this.ANON_KEY);
  }

  /**
   * @deprecated Will be removed in future release.
   * Use SupabaseServerClientFactory instead.
   */
  static async createServerClient() {
    const { cookies } = await import('next/headers');

    const cookieStore = await cookies();

    return supabaseCreateServerClient(this.URL, this.ANON_KEY, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookies: { name: string; value: string; options: CookieOptions }[],
        ) {
          try {
            cookies.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch (error) {
            console.error('Failed to set cookies', error);
          }
        },
      },
    });
  }
}
