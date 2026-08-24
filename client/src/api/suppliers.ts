import { http } from '@/lib/http'
import { toQueryString } from '@/lib/query'
import type { CreateSupplierRequest, PageResponse, Supplier } from '@/types/api'

export interface ListSuppliersParams {
  includeInactive?: boolean
  page?: number
  pageSize?: number
}

export function listSuppliers(params: ListSuppliersParams) {
  return http
    .get<PageResponse<Supplier>>(`/api/suppliers${toQueryString(params)}`)
    .then((r) => r.data)
}

export function createSupplier(body: CreateSupplierRequest) {
  return http.post<Supplier>('/api/suppliers', body).then((r) => r.data)
}

export function setSupplierStatus(id: string, active: boolean) {
  return http.put<void>(`/api/suppliers/${id}/status${toQueryString({ active })}`).then((r) => r.data)
}

export function linkSupplierProduct(supplierId: string, productId: string, supplierProductCode?: string) {
  return http
    .put<void>(
      `/api/suppliers/${supplierId}/products/${productId}${toQueryString({ supplierProductCode })}`,
    )
    .then((r) => r.data)
}
