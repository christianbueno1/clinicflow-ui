export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export const emptyPage = <T>(pageSize: number): Page<T> => ({
  items: [],
  total: 0,
  page: 1,
  page_size: pageSize,
  total_pages: 0,
});