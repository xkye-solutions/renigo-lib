import { SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseClientFactoryInterface {
  createClient(
    url?: string,
    anonKey?: string,
  ): SupabaseClient | Promise<SupabaseClient>;
}
