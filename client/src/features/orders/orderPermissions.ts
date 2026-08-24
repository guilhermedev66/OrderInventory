import type { OrderStatus } from '@/types/api'

export interface OrderPermissions {
  canAddItem: boolean
  canSubmit: boolean
  canCancel: boolean
  canConfirm: boolean
  canProcess: boolean
  canComplete: boolean
}

export function getOrderPermissions(
  status: OrderStatus,
  itemCount: number,
  isManagement: boolean,
): OrderPermissions {
  return {
    canAddItem: !isManagement && status === 'Draft',
    canSubmit: !isManagement && status === 'Draft' && itemCount > 0,
    canCancel: !isManagement && ['Draft', 'Pending', 'Confirmed'].includes(status),
    canConfirm: isManagement && status === 'Pending',
    canProcess: isManagement && status === 'Confirmed',
    canComplete: isManagement && status === 'Processing',
  }
}
