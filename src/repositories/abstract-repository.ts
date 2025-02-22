import { QueryBuilder } from '@/utils';
import { PostgrestFilterBuilder, PostgrestQueryBuilder, PostgrestTransformBuilder } from '@supabase/postgrest-js';
import { SupabaseClient } from '@supabase/supabase-js';
import { GenericSchema, GenericTable } from '@supabase/supabase-js/src/lib/types';

/**
 * Abstract class providing a generic repository for database operations.
 * Supports querying, inserting, updating, sof deleting, and counting records.
 */
export abstract class AbstractRepository<
  Schema extends GenericSchema,
  Relation extends GenericTable,
  Entity = Relation['Row'],
> {
  /**
   * The name of the table (must be defined in subclasses).
   */
  protected abstract readonly TABLE_NAME: string;

  /**
   * The database schema name (default: 'public').
   */
  protected readonly SCHEMA_NAME: string = 'public';

  /**
   * The column used for tracking creation timestamps.
   */
  protected readonly CREATED_AT: string = 'created_at';

  /**
   * The column used for tracking update timestamps.
   */
  protected readonly UPDATED_AT: string = 'updated_at';

  /**
   * The column used for soft deletion.
   */
  protected readonly DELETED_AT: string = 'deleted_at';

  /**
   * Determines whether soft deletion is enabled.
   */
  protected readonly hasSoftDelete = true;

  constructor(protected readonly client: SupabaseClient) {}

  /**
   * Provides a query builder for executing database operations.
   * @throws {Error} - If `TABLE_NAME` is not defined.
   */
  public get queryBuilder(): PostgrestQueryBuilder<Schema, Relation, Entity> {
    if (!this.TABLE_NAME) {
      throw new Error('Table name must be defined');
    }

    return this.client
      .schema<string>(this.SCHEMA_NAME)
      .from<string, Relation>(this.TABLE_NAME);
  }

  /**
   * Abstract factory method to enforce implementation in subclasses.
   */
  static getInstance() {
    throw new Error('Method not implemented');
  }

  /**
   * Retrieves all records from the table, with optional filtering and pagination.
   */
  public async all<E = Entity>(options?: {
    ascending?: boolean;
    nullsFirst?: boolean;
    referencedTable?: string;
    page?: number;
    select?: string;
    includeDeleted?: boolean;
    queryBuilder?: (
      builder: PostgrestFilterBuilder<Schema, Relation['Row'], E[]>,
    ) => PostgrestTransformBuilder<Schema, Relation, E[]>;
    mapData?: (data: E, index?: number, array?: E[]) => Readonly<E>;
  }): Promise<QueryBuilder<Schema, Relation, E>> {
    let initialBuilder: PostgrestFilterBuilder<Schema, Relation['Row'], E[]> =
      this.queryBuilder.select(options?.select ?? '*', {
        count: 'exact',
      });

    if (this.hasSoftDelete && !options?.includeDeleted) {
      initialBuilder = initialBuilder.is(this.DELETED_AT, null);
    }

    const finalBuilder = options?.queryBuilder
      ? options.queryBuilder(initialBuilder)
      : initialBuilder;

    return new QueryBuilder<Schema, Relation, E>(finalBuilder);
  }

  /**
   * Finds a record by its primary key
   */
  public async find<
    E = Entity,
    C extends string & keyof Relation['Row'] = 'id',
  >(
    id: string,
    options?: {
      select?: string;
      column?: C;
    },
  ): Promise<E | null> {
    const { data, error } = await this.queryBuilder
      .select(options?.select ?? '*')
      .eq(options?.column ?? 'id', id)
      .maybeSingle<E>();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Inserts a new record into the table.
   */
  public async create<E = Entity>(data: Relation['Insert']): Promise<E> {
    const timestamp = new Date().toISOString();
    const { data: created, error } = await this.queryBuilder
      .insert({
        ...data,
        [this.CREATED_AT]: timestamp,
        [this.UPDATED_AT]: timestamp,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      .select()
      .single<E>();

    if (error) {
      throw error;
    }

    return created;
  }

  /**
   * Updates a record by its primary key.
   */
  public async update<
    E = Entity,
    C extends string & keyof Relation['Row'] = 'id',
  >(
    id: string,
    data: Relation['Update'],
    options?: {
      select?: string;
      column?: C;
    },
  ): Promise<E> {
    const { data: updated, error } = await this.queryBuilder
      .update({
        ...data,
        [this.UPDATED_AT]: new Date().toISOString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      .eq(options?.column ?? 'id', id)
      .select(options?.select ?? '*')
      .single<E>();

    if (error) {
      throw error;
    }

    return updated;
  }

  /**
   * Deletes a record by its primary key.
   * Uses soft delete if `hasSoftDelete` is enabled.
   */
  public async delete<C extends string & keyof Relation['Row'] = 'id'>(
    id: string,
    options?: { column?: C },
  ): Promise<boolean> {
    const timestamp = new Date().toISOString();
    const queryBuilder = () => {
      if (this.hasSoftDelete) {
        return this.queryBuilder.update({
          [this.DELETED_AT]: timestamp,
          [this.UPDATED_AT]: timestamp,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
      }

      return this.queryBuilder.delete();
    };

    const { error } = await queryBuilder().eq(options?.column ?? 'id', id);

    if (error) {
      throw new Error(`Unable to delete: ${error.message}`, { cause: error });
    }

    return true;
  }

  /**
   * Finds multiple records by a column value.
   */
  public async findByColumn<
    C extends string & keyof Relation['Row'],
    E = Entity,
  >(
    column: C,
    value: NonNullable<Relation['Row'][C]>,
    options?: { select?: string },
  ): Promise<E[]> {
    const { data, error } = await this.queryBuilder
      .select(options?.select ?? '*')
      .eq(column, value)
      .returns<E[]>();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Finds one or null records by a column value.
   */
  public async findOneByColumn<
    C extends string & keyof Relation['Row'],
    E = Entity,
  >(
    column: C,
    value: NonNullable<Relation['Row'][C]>,
    options?: { select?: string },
  ): Promise<E | null> {
    const { data, error } = await this.queryBuilder
      .select(options?.select ?? '*')
      .eq(column, value)
      .maybeSingle<E>();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Counts records that match a column value.
   */
  public async countByColumn<C extends string & keyof Relation['Row']>(
    column: C,
    value: NonNullable<Relation['Row'][C]>,
    options?: { select?: string },
  ): Promise<number> {
    const { count, error } = await this.queryBuilder
      .select(options?.select ?? '*', { count: 'exact', head: true })
      .eq(column, value)
      .returns<number>();

    if (error) {
      throw error;
    }

    return count ?? 0;
  }
}
