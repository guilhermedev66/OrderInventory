// Mirrors OrderInventory.Api DTOs exactly (System.Text.Json default camelCase).

export type Role = 'User' | 'Manager' | 'Admin'

export interface PageResponse<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
}

export interface AuthResponse {
  userId: string
  email: string
  accessToken: string
  expiresAtUtc: string
}

export interface Product {
  id: string
  name: string
  sku: string
  description: string | null
  price: number
  isActive: boolean
  minimumStock: number
  availableStock: number
  createdAtUtc: string
  updatedAtUtc: string
}

export interface CreateProductRequest {
  name: string
  sku: string
  description?: string | null
  price: number
  minimumStock: number
}

export interface UpdateProductRequest {
  name: string
  description?: string | null
  minimumStock: number
}

export interface Supplier {
  id: string
  name: string
  contactEmail: string | null
  isActive: boolean
  createdAtUtc: string
}

export interface CreateSupplierRequest {
  name: string
  contactEmail?: string | null
}

export interface InventoryBalance {
  productId: string
  productName: string
  sku: string
  onHandStock: number
  reservedStock: number
  availableStock: number
  minimumStock: number
  belowMinimumStock: boolean
}

export type StockMovementType = 'Received' | 'Reserved' | 'ReservationReleased' | 'Fulfilled'

export interface StockMovement {
  id: string
  productId: string
  type: StockMovementType
  quantity: number
  occurredAtUtc: string
  supplierId: string | null
  orderId: string | null
}

export interface ReceiveStockRequest {
  quantity: number
  supplierId?: string | null
}

export type OrderStatus = 'Draft' | 'Pending' | 'Confirmed' | 'Processing' | 'Completed' | 'Cancelled'

export interface OrderItem {
  id: string
  productId: string
  productName: string
  sku: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Order {
  id: string
  customerId: string
  status: OrderStatus
  total: number
  items: OrderItem[]
  createdAtUtc: string
  updatedAtUtc: string
  submittedAtUtc: string | null
  confirmedAtUtc: string | null
  processingAtUtc: string | null
  completedAtUtc: string | null
  cancelledAtUtc: string | null
}

export interface AddOrderItemRequest {
  productId: string
  quantity: number
}

export interface CreateUserRequest {
  email: string
  password: string
  role: Role
}

export interface CreateUserResponse {
  id: string
  email: string
  role: string
}

export interface ProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  errors?: Record<string, string[]>
  [key: string]: unknown
}
