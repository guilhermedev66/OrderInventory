import { http } from '@/lib/http'
import { toQueryString } from '@/lib/query'
import type { InventoryBalance, PageResponse, ReceiveStockRequest, StockMovement } from '@/types/api'

export interface ListInventoryParams {
  belowMinimumOnly?: boolean
  page?: number
  pageSize?: number
}

export function listInventory(params: ListInventoryParams) {
  return http
    .get<PageResponse<InventoryBalance>>(`/api/inventory${toQueryString(params)}`)
    .then((r) => r.data)
}

export function receiveStock(productId: string, body: ReceiveStockRequest) {
  return http.post<void>(`/api/inventory/${productId}/receipts`, body).then((r) => r.data)
}

export interface ListMovementsParams {
  productId?: string
  orderId?: string
  page?: number
  pageSize?: number
}

export function listMovements(params: ListMovementsParams) {
  return http
    .get<PageResponse<StockMovement>>(`/api/inventory/movements${toQueryString(params)}`)
    .then((r) => r.data)
}
