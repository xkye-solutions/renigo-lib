import { SupabaseSingleton } from './supabase-singleton';
import { PostgrestQueryBuilder } from '@supabase/postgrest-js';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  GenericSchema,
  GenericTable,
  GenericView,
} from '@supabase/supabase-js/src/lib/types';

export class SupabaseQueryBuilder<
  Schema extends GenericSchema,
  Relation extends GenericTable | GenericView,
> {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  static async getInstance() {
    return new SupabaseQueryBuilder(
      await SupabaseSingleton.getServerInstance()
    );
  }

  from(table: string): PostgrestQueryBuilder<Schema, Relation> {
    return this.client.from<string, Relation>(table);
  }
}
