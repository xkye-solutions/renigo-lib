import {
  SupabaseAdminClientFactory,
  SupabaseAnonClientFactory,
  SupabaseServerClientFactory,
} from '@/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Singleton class for managing Supabase clients
 * Provides static methods to get instances of the server, anon, and admin clients
 */
export class SupabaseSingleton {
  private static serverInstance: Promise<SupabaseClient> | null = null;
  private static anonInstance: SupabaseClient | null = null;
  private static adminInstance: SupabaseClient | null = null;

  public static getServerInstance(
    url?: string,
    anonKey?: string,
  ): Promise<SupabaseClient> {
    if (!this.serverInstance) {
      this.serverInstance = new SupabaseServerClientFactory().createClient(
        url,
        anonKey,
      );
    }

    return this.serverInstance;
  }

  public static getAnonInstance(
    url?: string,
    anonKey?: string,
  ): SupabaseClient {
    if (!this.anonInstance) {
      this.anonInstance = new SupabaseAnonClientFactory().createClient(
        url,
        anonKey,
      );
    }

    return this.anonInstance;
  }

  public static getAdminInstance(
    url?: string,
    serviceRole?: string,
  ): SupabaseClient {
    if (!this.adminInstance) {
      this.adminInstance = new SupabaseAdminClientFactory().createClient(
        url,
        serviceRole,
      );
    }

    return this.adminInstance;
  }
}
