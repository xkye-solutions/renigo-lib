import { type CookieOptions, createServerClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseClientFactoryInterface } from './supabase-client-factory-interface';

export class SupabaseServerClientFactory
  implements SupabaseClientFactoryInterface
{
  public async createClient(
    url?: string,
    anonKey?: string,
  ): Promise<SupabaseClient> {
    const { cookies } = await import('next/headers');

    const cookieStore = await cookies();

    return createServerClient(
      url ?? (process.env.NEXT_PUBLIC_SUPABASE_URL as string),
      anonKey ?? (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string),
      {
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
      },
    );
  }
}
