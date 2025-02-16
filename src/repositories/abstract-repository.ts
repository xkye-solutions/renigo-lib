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

  protected readonly client: SupabaseClient;

  protected TABLE_NAME: string = '';

  protected SCHEMA_NAME: string = 'public';

  protected CREATED_AT: string = 'created_at';

  protected UPDATED_AT: string = 'updated_at';

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  get queryBuilder(): PostgrestQueryBuilder<Schema, Relation> {
    return this.client
      .schema<string>(this.SCHEMA_NAME)
      .from<string, Relation>(this.TABLE_NAME);
  }

  set pageSize(value: number) {
    this.defaultPageSize = value;
  }

  public async all(options?: {
    ascending?: boolean;
    nullsFirst?: boolean;
    referencedTable?: string;
    page?: number;
    select?: string;
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

    const initialBuilder = this.queryBuilder.select(options?.select ?? '*', {
      count: 'exact',
    });

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
    const { data: created, error } = await this.queryBuilder
      .insert({
        ...data,
        [this.CREATED_AT]: new Date().toISOString(),
        [this.UPDATED_AT]: new Date().toISOString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      .select()
      .single();

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
}
