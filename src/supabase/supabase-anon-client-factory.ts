import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseClientFactoryInterface } from './supabase-client-factory-interface';

export class SupabaseAnonClientFactory
  implements SupabaseClientFactoryInterface
{
  public createClient(url?: string, anonKey?: string): SupabaseClient {
    return createClient(
      url ?? (process.env.NEXT_PUBLIC_SUPABASE_URL as string),
      anonKey ?? (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string),
    );
  }
}
