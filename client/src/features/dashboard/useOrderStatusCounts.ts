import { useQueries } from '@tanstack/react-query'
import { listManagementOrders, listMyOrders } from '@/api/orders'
import type { OrderStatus } from '@/types/api'

const STATUSES: OrderStatus[] = ['Pending', 'Confirmed', 'Processing', 'Completed']

export function useOrderStatusCounts(scope: 'mine' | 'management') {
  const results = useQueries({
    queries: STATUSES.map((status) => ({
      queryKey: ['order-status-count', scope, status],
      queryFn: () =>
        scope === 'management'
          ? listManagementOrders({ status, page: 1, pageSize: 1 })
          : listMyOrders({ status, page: 1, pageSize: 1 }),
      staleTime: 30_000,
    })),
  })

  const isLoading = results.some((r) => r.isLoading)
  const isError = results.some((r) => r.isError)
  const counts = STATUSES.reduce<Record<OrderStatus, number>>(
    (acc, status, i) => {
      acc[status] = results[i].data?.totalCount ?? 0
      return acc
    },
    {} as Record<OrderStatus, number>,
  )

  return {
    counts,
    isLoading,
    isError,
    retry: () => Promise.all(results.map((result) => result.refetch())),
  }
}
