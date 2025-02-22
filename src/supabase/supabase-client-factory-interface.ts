import { SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseClientFactoryInterface {
  createClient(): SupabaseClient | Promise<SupabaseClient>;
}
