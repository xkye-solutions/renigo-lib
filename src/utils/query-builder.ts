import { Paginator } from '@/dto';
import { PostgrestTransformBuilder } from '@supabase/postgrest-js';
import {
  GenericSchema,
  GenericTable,
} from '@supabase/supabase-js/src/lib/types';

export class QueryBuilder<
  Schema extends GenericSchema,
  Relation extends GenericTable,
  Entity = Relation['Row'],
> {
  private readonly builder: PostgrestTransformBuilder<
    Schema,
    Relation['Row'],
    Entity[]
  >;

  constructor(
    builder: PostgrestTransformBuilder<Schema, Relation['Row'], Entity[]>,
  ) {
    this.builder = builder;
  }

  public async get(): Promise<Entity[]> {
    const { data, error } = await this.builder;

    if (error) {
      throw error;
    }

    return data;
  }

  public async paginate<E = Entity>(options?: {
    page?: number;
    perPage?: number;
  }) {
    const { from, to } = this.getPaginationRange(
      options?.page,
      options?.perPage,
    );
    const { data, error, count } = await this.builder
      .range(from, to)
      .returns<E[]>();

    if (error) {
      throw error;
    }

    return new Paginator<E>({
      data,
      total: count ?? 0,
      currentPage: options?.page ?? 1,
      perPage: options?.perPage ?? 15,
    });
  }

  private getPaginationRange(
    page: number = 1,
    perPage?: number,
  ): { from: number; to: number } {
    const limit = perPage ? +perPage : 15;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    return {
      from,
      to,
    };
  }
}
