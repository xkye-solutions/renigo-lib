export class Paginator<E> {
  public readonly data: Readonly<E>[];
  public readonly total: number;
  public readonly currentPage: number;
  public readonly perPage: number;
  public readonly totalPages: number;

  constructor({
    data,
    total,
    currentPage,
    perPage,
  }: {
    data: Readonly<E>[];
    total: number;
    currentPage: number;
    perPage: number;
  }) {
    this.data = data;
    this.total = total;
    this.currentPage = currentPage;
    this.perPage = perPage;
    this.totalPages = Math.ceil(total / perPage);
  }
}
