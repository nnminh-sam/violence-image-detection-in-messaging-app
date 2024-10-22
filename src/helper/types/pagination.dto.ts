export interface PaginationDto {
  page: number;
  size: number;
  sortBy: string;
  orderBy: 'asc' | 'desc';
}
