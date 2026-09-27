export const DEFAULT_PAGE_SIZE = 20;

export type ListSearchParams = {
  q?: string;
  page?: string;
};

export function parseListParams(searchParams: ListSearchParams) {
  const q = searchParams.q?.trim() ?? "";
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const pageSize = DEFAULT_PAGE_SIZE;
  const skip = (page - 1) * pageSize;

  return { q, page, pageSize, skip };
}

export function buildPageHref(basePath: string, q: string, page: number) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function getPaginationMeta(total: number, page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);

  return { totalPages, safePage, from, to, total };
}
