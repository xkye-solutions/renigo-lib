import { SupabaseClientFactory } from './supabase-client-factory';
import { SupabaseClient } from '@supabase/supabase-js';

export class SupabaseSingleton {
  private static instance: SupabaseClient;

  // @deprecated: Will remove this in future release
  static getBrowserInstance (): SupabaseClient {
    if (!SupabaseSingleton.instance) {
      SupabaseSingleton.instance = SupabaseClientFactory.createBrowserClient();
    }

    return SupabaseSingleton.instance;
  }

  static async getServerInstance (): Promise<SupabaseClient> {
    return await SupabaseClientFactory.createServerClient();
  }

  static async getAnonInstance (): Promise<SupabaseClient> {
    return await SupabaseClientFactory.createAnonClient();
  }

  static async getAdminInstance (): Promise<SupabaseClient> {
    return await SupabaseClientFactory.createAdminClient();
  }
}
