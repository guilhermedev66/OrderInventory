import { http } from '@/lib/http'
import { toQueryString } from '@/lib/query'
import type { CreateProductRequest, PageResponse, Product, UpdateProductRequest } from '@/types/api'

export interface ListProductsParams {
  search?: string
  includeInactive?: boolean
  page?: number
  pageSize?: number
}

export function listProducts(params: ListProductsParams) {
  return http
    .get<PageResponse<Product>>(`/api/products${toQueryString(params)}`)
    .then((r) => r.data)
}

export function getProduct(id: string) {
  return http.get<Product>(`/api/products/${id}`).then((r) => r.data)
}

export function createProduct(body: CreateProductRequest) {
  return http.post<Product>('/api/products', body).then((r) => r.data)
}

export function updateProduct(id: string, body: UpdateProductRequest) {
  return http.put<void>(`/api/products/${id}`, body).then((r) => r.data)
}

export function changeProductPrice(id: string, price: number) {
  return http.put<void>(`/api/products/${id}/price`, { price }).then((r) => r.data)
}

export function setProductStatus(id: string, active: boolean) {
  return http.put<void>(`/api/products/${id}/status${toQueryString({ active })}`).then((r) => r.data)
}
