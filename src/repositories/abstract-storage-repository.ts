import { StorageClient, TransformOptions } from '@supabase/storage-js';
import { SupabaseClient } from '@supabase/supabase-js';

export abstract class AbstractStorageRepository {
  protected BUCKET_NAME: string = '';

  protected readonly client: StorageClient;

  protected readonly supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.client = supabase.storage;
  }

  get api() {
    if (this.BUCKET_NAME === '' || !this.BUCKET_NAME) {
      throw new Error('Bucket name must be defined');
    }

    return this.client.from(this.BUCKET_NAME);
  }

  getPublicUrl(path: string, options?: { transform?: TransformOptions }) {
    const {
      data: { publicUrl },
    } = this.api.getPublicUrl(path, options);

    return publicUrl;
  }

  async upload(file: File, filename?: string) {
    const { data, error } = await this.api.upload(
      `${filename ?? Date.now()}`,
      file,
    );

    if (error) {
      throw error;
    }

    return data;
  }
}
