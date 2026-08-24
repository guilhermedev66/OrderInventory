import { http } from '@/lib/http'
import { toQueryString } from '@/lib/query'
import type { AddOrderItemRequest, Order, OrderStatus, PageResponse } from '@/types/api'

export interface ListMyOrdersParams {
  status?: OrderStatus
  page?: number
  pageSize?: number
}

export function listMyOrders(params: ListMyOrdersParams) {
  return http.get<PageResponse<Order>>(`/api/orders${toQueryString(params)}`).then((r) => r.data)
}

export function getMyOrder(id: string) {
  return http.get<Order>(`/api/orders/${id}`).then((r) => r.data)
}

export function createOrder() {
  return http.post<Order>('/api/orders').then((r) => r.data)
}

export function addOrderItem(orderId: string, body: AddOrderItemRequest) {
  return http.post<void>(`/api/orders/${orderId}/items`, body).then((r) => r.data)
}

export function submitOrder(orderId: string) {
  return http.post<void>(`/api/orders/${orderId}/submit`).then((r) => r.data)
}

export function cancelOrder(orderId: string) {
  return http.post<void>(`/api/orders/${orderId}/cancel`).then((r) => r.data)
}

export interface ListManagementOrdersParams {
  customerId?: string
  status?: OrderStatus
  page?: number
  pageSize?: number
}

export function listManagementOrders(params: ListManagementOrdersParams) {
  return http
    .get<PageResponse<Order>>(`/api/orders/management${toQueryString(params)}`)
    .then((r) => r.data)
}

export function confirmOrder(orderId: string) {
  return http.post<void>(`/api/orders/${orderId}/confirm`).then((r) => r.data)
}

export function processOrder(orderId: string) {
  return http.post<void>(`/api/orders/${orderId}/process`).then((r) => r.data)
}

export function completeOrder(orderId: string) {
  return http.post<void>(`/api/orders/${orderId}/complete`).then((r) => r.data)
}
