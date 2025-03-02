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
  public static getInstance() {
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

  /**
   * Downloads a file from the storage bucket.
   * @throws {Error} - If the download fails.
   */
  public async download(path: string): Promise<Blob> {
    const { data, error } = await this.api.download(path);

    if (error) {
      throw new Error(`Download failed: ${error.message}`, { cause: error });
    }

    return data;
  }

  /**
   * Lists all files in the storage bucket.
   * @throws {Error} - If the listing fails.
   */
  public async list(path?: string): Promise<{ name: string; id: string }[]> {
    const { data, error } = await this.api.list(path);

    if (error) {
      throw new Error(`List failed: ${error.message}`, { cause: error });
    }

    return data;
  }

  /**
   * Removes a file from the storage bucket.
   * @throws {Error} - If the removal fails.
   */
  public async remove(path: string): Promise<void> {
    const { error } = await this.api.remove([path]);

    if (error) {
      throw new Error(`Remove failed: ${error.message}`, { cause: error });
    }
  }

  /**
   * Moves/renames a file within the storage bucket.
   * @throws {Error} - If the move fails.
   */
  public async move(from: string, to: string): Promise<void> {
    const { error } = await this.api.move(from, to);

    if (error) {
      throw new Error(`Move failed: ${error.message}`, { cause: error });
    }
  }

  /**
   * Creates a signed URL for temporary access to a file.
   * @throws {Error} - If URL creation fails.
   */
  public async createSignedUrl(
    path: string,
    expiresIn: number,
  ): Promise<{ signedUrl: string }> {
    const { data, error } = await this.api.createSignedUrl(path, expiresIn);

    if (error) {
      throw new Error(`Sign URL creation failed: ${error.message}`, {
        cause: error,
      });
    }

    return data;
  }
}
