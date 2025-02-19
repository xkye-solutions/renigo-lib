import {
  PostgrestFilterBuilder,
  PostgrestQueryBuilder,
  PostgrestTransformBuilder,
} from '@supabase/postgrest-js';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  GenericSchema,
  GenericTable,
} from '@supabase/supabase-js/src/lib/types';

export interface PaginationRange {
  from: number;
  to: number;
}

export interface AllResponse<T> {
  data: T[];
  count: number;
  currentPage: number;
  totalPages: number;
}

export abstract class AbstractRepository<
  Schema extends GenericSchema,
  Relation extends GenericTable,
  Entity = Relation['Row'],
> {
  protected defaultPageSize = 15;

  protected TABLE_NAME: string = '';

  protected SCHEMA_NAME: string = 'public';

  protected CREATED_AT: string = 'created_at';

  protected UPDATED_AT: string = 'updated_at';

  protected DELETED_AT: string = 'deleted_at';

  protected readonly hasSoftDelete = true;

  constructor(protected readonly client: SupabaseClient) {
    return new Proxy(this, {
      get: (target, prop, options) => {
        const methodName = prop.toString();

        if (methodName.startsWith('findBy')) {
          const column = this.getColumnFromMethod(methodName, 'findBy');

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (value: any) => this.findByColumn(column, value, options);
        }

        if (methodName.startsWith('findOneBy')) {
          const column = this.getColumnFromMethod(methodName, 'findOneBy');

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (value: any) => this.findOneByColumn(column, value, options);
        }

        if (methodName.startsWith('countBy')) {
          const column = this.getColumnFromMethod(methodName, 'countBy');

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (value: any) => this.countByColumn(column, value);
        }

        return target[methodName as keyof typeof target];
      },
    });
  }

  public get queryBuilder(): PostgrestQueryBuilder<Schema, Relation> {
    if (this.TABLE_NAME === '' || !this.TABLE_NAME) {
      throw new Error('Table name must be defined');
    }

    return this.client
      .schema<string>(this.SCHEMA_NAME)
      .from<string, Relation>(this.TABLE_NAME);
  }

  public set pageSize(value: number) {
    if (value <= 0) {
      throw new Error('Page size must be greater than zero');
    }

    this.defaultPageSize = value;
  }

  public async all(options?: {
    ascending?: boolean;
    nullsFirst?: boolean;
    referencedTable?: string;
    page?: number;
    select?: string;
    includeDeleted?: boolean;
    queryBuilder?: (
      builder: PostgrestFilterBuilder<
        Schema,
        Relation['Row'],
        unknown,
        unknown,
        unknown
      >,
    ) => PostgrestTransformBuilder<Schema, Relation, Entity>;
    mapData?: (
      data: Entity,
      index?: number,
      array?: Entity[],
    ) => Readonly<Entity>;
  }): Promise<AllResponse<Entity>> {
    const { from, to } = this.getPaginationRange(options?.page);

    let initialBuilder = this.queryBuilder.select(options?.select ?? '*', {
      count: 'exact',
    });
    if (this.hasSoftDelete && !options?.includeDeleted) {
      initialBuilder = initialBuilder.is(this.DELETED_AT, null);
    }

    const builder = options?.queryBuilder
      ? options.queryBuilder(initialBuilder).range(from, to)
      : initialBuilder
          .order(this.CREATED_AT, {
            ...options,
            ascending: options?.ascending ?? false,
          })
          .range(from, to);

    const { data, error, count } = await builder;

    if (error) {
      throw error;
    }

    const theData: Entity[] = options?.mapData
      ? (data as Entity[]).flatMap(options.mapData)
      : (data as Entity[]);

    return {
      data: theData ?? [],
      count: count ?? 0,
      currentPage: options?.page ? Number(options.page) : 1,
      totalPages: Math.ceil((count ?? 0) / this.defaultPageSize),
    };
  }

  public async find(
    id: string,
    options?: {
      select?: string;
      column?: string;
    },
  ): Promise<Entity | null> {
    const { data, error } = await this.queryBuilder
      .select(options?.select ?? '*')
      .eq(options?.column ?? 'id', id)
      .maybeSingle<Entity>();

    if (error) {
      throw error;
    }

    return data;
  }

  public async create(data: Relation['Insert']): Promise<Entity> {
    const timestamp = new Date().toISOString();
    const { data: created, error } = await this.queryBuilder
      .insert({
        ...data,
        [this.CREATED_AT]: timestamp,
        [this.UPDATED_AT]: timestamp,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      .select()
      .single<Entity>();

    if (error) {
      throw error;
    }

    return created as Entity;
  }

  public async update(
    id: string,
    data: Relation['Update'],
    options?: {
      select?: string;
      column?: string;
    },
  ): Promise<Entity> {
    const { data: updated, error } = await this.queryBuilder
      .update({
        ...data,
        [this.UPDATED_AT]: new Date().toISOString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      .eq(options?.column ?? 'id', id)
      .select(options?.select ?? '*')
      .single<Entity>();

    if (error) {
      throw error;
    }

    return updated as Entity;
  }

  public async delete(
    id: string,
    options?: { column?: string },
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

  // @todo: Create a Paginator class to handle pagination
  protected getPaginationRange(
    page: number = 1,
    pageSize: number = this.defaultPageSize,
  ): PaginationRange {
    const limit = pageSize ? +pageSize : this.defaultPageSize;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    return {
      from,
      to,
    };
  }

  private getColumnFromMethod(methodName: string, prefix: string): string {
    return methodName
      .replace(prefix, '')
      .replace(/([A-Z])/g, '_$1') // Convert camelCase to snake_case (if needed)
      .toLowerCase();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async findByColumn(
    column: string,
    value: any,
    options?: { select?: string },
  ): Promise<Entity[]> {
    const { data, error } = await this.queryBuilder
      .select(options?.select ?? '*')
      .eq(column, value);

    if (error) {
      throw error;
    }

    return data as Entity[];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async findOneByColumn(
    column: string,
    value: any,
    options?: { select?: string },
  ): Promise<Entity | null> {
    const { data, error } = await this.queryBuilder
      .select(options?.select ?? '*')
      .eq(column, value)
      .maybeSingle<Entity>();

    if (error) {
      throw error;
    }

    return data;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async countByColumn(column: string, value: any): Promise<number> {
    const { count, error } = await this.queryBuilder
      .select('*', { count: 'exact', head: true })
      .eq(column, value);

    if (error) {
      throw error;
    }

    return count ?? 0;
  }
}
