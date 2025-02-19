import { StorageClient, TransformOptions } from '@supabase/storage-js';
import { SupabaseClient } from '@supabase/supabase-js';

export abstract class AbstractStorageRepository {
  protected BUCKET_NAME: string = '';

  protected readonly client: StorageClient;

  constructor(protected readonly supabase: SupabaseClient) {
    this.client = supabase.storage;
  }

  public get api() {
    if (this.BUCKET_NAME === '' || !this.BUCKET_NAME) {
      throw new Error('BUCKET_NAME must be defined');
    }

    return this.client.from(this.BUCKET_NAME);
  }

  public getPublicUrl(
    path: string,
    options?: { transform?: TransformOptions },
  ) {
    if (/^[a-zA-Z]+:\/\//.test(path)) {
      return path;
    }

    const {
      data: { publicUrl },
    } = this.api.getPublicUrl(path, options);

    return publicUrl;
  }

  public async upload(
    file: File,
    filename?: string,
  ): Promise<{ id: string; path: string; fullPath: string }> {
    const uniqueFilename = filename ?? crypto.randomUUID();
    const { data, error } = await this.api.upload(uniqueFilename, file);

    if (error) {
      throw new Error(`Upload failed: ${error.message}`, { cause: error });
    }

    return data;
  }
}
