import type { PageResponse } from '@/types/api'

/**
 * The API only paginates + filters what each endpoint's query params support.
 * A few reads the frontend needs (a single inventory balance by product, a
 * single management order by id) have no matching filter/GET-by-id route.
 * This walks pages of the existing list endpoint client-side as the
 * correct-but-bounded workaround, instead of inventing an endpoint that
 * doesn't exist. Capped so a huge dataset degrades to "not found" rather
 * than hanging on unbounded requests.
 */
export async function findAcrossPages<T>(
  fetchPage: (page: number) => Promise<PageResponse<T>>,
  predicate: (item: T) => boolean,
  options: { pageSize?: number; maxPages?: number } = {},
): Promise<T | null> {
  const maxPages = options.maxPages ?? 25
  for (let page = 1; page <= maxPages; page++) {
    const result = await fetchPage(page)
    const match = result.items.find(predicate)
    if (match) return match
    if (page * result.pageSize >= result.totalCount) break
  }
  return null
}
