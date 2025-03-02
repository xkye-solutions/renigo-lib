import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseClientFactoryInterface } from './supabase-client-factory-interface';

export class SupabaseAdminClientFactory
  implements SupabaseClientFactoryInterface
{
  public createClient(url?: string, serviceRole?: string): SupabaseClient {
    return createClient(
      url ?? (process.env.NEXT_PUBLIC_SUPABASE_URL as string),
      serviceRole ?? (process.env.SUPABASE_SERVICE_ROLE as string),
    );
  }
}
