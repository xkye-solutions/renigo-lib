import { StorageClient, TransformOptions } from '@supabase/storage-js';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Abstract class for managing storage operations using Supabase Storage.
 * Provides methods for uploading files and generating public URLs.
 */
export abstract class AbstractStorageRepository {
  /**
   * The name of the storage bucket (must be defined in subclasses).
   */
  protected abstract readonly BUCKET_NAME: string;

  /**
   * Supabase Storage client instance
   */
  protected readonly client: StorageClient;

  constructor(protected readonly supabase: SupabaseClient) {
    this.client = supabase.storage;
  }

  /**
   * Provides access to the storage API for the defined bucket.
   * @throws {Error} - If `BUCKET_NAME` is not defined.
   */
  public get api() {
    if (!this.BUCKET_NAME) {
      throw new Error('BUCKET_NAME must be defined');
    }

    return this.client.from(this.BUCKET_NAME);
  }

  /**
   * Factory method to enforce implementation in subclasses.
   */
  static getInstance() {
    throw new Error('No implementation yet');
  }

  /**
   * Retrieves the public URL of a stored file.
   * If the provided path is already a URL, it is returned as is.
   */
  public getPublicUrl(
    path: string,
    options?: { transform?: TransformOptions },
  ): string {
    if (/^[a-zA-Z]+:\/\//.test(path)) {
      return path;
    }

    const {
      data: { publicUrl },
    } = this.api.getPublicUrl(path, options);

    return publicUrl;
  }

  /**
   * Updates a file to the storage bucket.
   * @throws {Error} - If the upload fails.
   */
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
