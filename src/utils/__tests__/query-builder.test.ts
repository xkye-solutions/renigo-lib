import { describe, it, expect, vi } from 'vitest';
import { QueryBuilder } from '../query-builder';
import { Paginator } from '@/dto';
import { PostgrestTransformBuilder } from '@supabase/postgrest-js';
import { GenericSchema } from '@supabase/supabase-js/src/lib/types';

type TestRecord = { id: number };

describe('QueryBuilder', () => {
  const mockData: TestRecord[] = [{ id: 1 }, { id: 2 }];
  const mockError = new Error('Test error');

  const createMockBuilder = <
    Schema extends GenericSchema = GenericSchema,
    Row extends TestRecord = TestRecord,
    Result = Row[],
  >(
    data: Result | null = null,
    error: Error | null = null,
    count: number | null = null,
  ): PostgrestTransformBuilder<Schema, Row, Result> => {
    const mockBuilder = {
      range: vi.fn().mockReturnThis(),
      returns: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation((callback) => {
        return Promise.resolve(callback({ data, error, count }));
      }),
    } as unknown as PostgrestTransformBuilder<Schema, Row, Result>;
    return mockBuilder;
  };

  describe('get()', () => {
    it('should return data when successful', async () => {
      const mockBuilder = createMockBuilder<
        GenericSchema,
        TestRecord,
        TestRecord[]
      >(mockData);
      const queryBuilder = new QueryBuilder(mockBuilder);

      const result = await queryBuilder.get();
      expect(result).toEqual(mockData);
    });

    it('should throw error when request fails', async () => {
      const mockBuilder = createMockBuilder<
        GenericSchema,
        TestRecord,
        TestRecord[]
      >([], mockError);
      const queryBuilder = new QueryBuilder(mockBuilder);

      await expect(queryBuilder.get()).rejects.toThrow(mockError);
    });
  });

  describe('paginate()', () => {
    it('should return paginated data with default options', async () => {
      const mockBuilder = createMockBuilder<
        GenericSchema,
        TestRecord,
        TestRecord[]
      >(mockData, null, 10);
      const queryBuilder = new QueryBuilder(mockBuilder);

      const result = await queryBuilder.paginate();

      expect(mockBuilder.range).toHaveBeenCalledWith(0, 14);
      expect(result).toBeInstanceOf(Paginator);
      expect(result.data).toEqual(mockData);
      expect(result.total).toBe(10);
      expect(result.currentPage).toBe(1);
      expect(result.perPage).toBe(15);
    });

    it('should return paginated data with custom options', async () => {
      const mockBuilder = createMockBuilder<
        GenericSchema,
        TestRecord,
        TestRecord[]
      >(mockData, null, 20);
      const queryBuilder = new QueryBuilder(mockBuilder);

      const result = await queryBuilder.paginate({ page: 2, perPage: 5 });

      expect(mockBuilder.range).toHaveBeenCalledWith(5, 9);
      expect(result).toBeInstanceOf(Paginator);
      expect(result.data).toEqual(mockData);
      expect(result.total).toBe(20);
      expect(result.currentPage).toBe(2);
      expect(result.perPage).toBe(5);
    });

    it('should throw error when request fails', async () => {
      const mockBuilder = createMockBuilder<
        GenericSchema,
        TestRecord,
        TestRecord[]
      >([], mockError);
      const queryBuilder = new QueryBuilder(mockBuilder);

      await expect(queryBuilder.paginate()).rejects.toThrow(mockError);
    });
  });
});
