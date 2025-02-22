import {
  SupabaseAdminClientFactory,
  SupabaseAnonClientFactory,
  SupabaseServerClientFactory,
} from '@/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

export class SupabaseSingleton {
  private static serverInstance: Promise<SupabaseClient> | null = null;
  private static anonInstance: SupabaseClient | null = null;
  private static adminInstance: SupabaseClient | null = null;

  static getServerInstance(): Promise<SupabaseClient> {
    if (!this.serverInstance) {
      this.serverInstance = new SupabaseServerClientFactory().createClient();
    }

    return this.serverInstance;
  }

  static getAnonInstance(): SupabaseClient {
    if (!this.anonInstance) {
      this.anonInstance = new SupabaseAnonClientFactory().createClient();
    }
    return this.anonInstance;
  }

  static getAdminInstance(): SupabaseClient {
    if (!this.adminInstance) {
      this.adminInstance = new SupabaseAdminClientFactory().createClient();
    }

    return this.adminInstance;
  }
}
