import {
  PostgrestFilterBuilder,
  PostgrestQueryBuilder,
  PostgrestTransformBuilder,
} from '@supabase/postgrest-js';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  GenericSchema,
  GenericTable,
  GenericView,
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
  Relation extends GenericTable | GenericView,
  Entity = Relation['Row'],
> {
  protected defaultPageSize = 15;

  protected readonly client: SupabaseClient;

  protected TABLE_NAME: string = '';

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  get queryBuilder(): PostgrestQueryBuilder<Schema, Relation> {
    return this.client.from<string, Relation>(this.TABLE_NAME);
  }

  set pageSize(value: number) {
    this.defaultPageSize = value;
  }

  public async all(options?: {
    ascending?: boolean;
    nullsFirst?: boolean;
    referencedTable?: undefined;
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
          .order('created_at', {
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

  async find(
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

  // @todo: Add the correct type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async create(data: any): Promise<Entity> {
    const { data: created, error } = await this.queryBuilder
      .insert(data)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return created as Entity;
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
