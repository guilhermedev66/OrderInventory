import { describe, expect, it } from 'vitest'
import { getOrderPermissions } from '@/features/orders/orderPermissions'

describe('getOrderPermissions', () => {
  it('allows a customer to edit and submit only a non-empty draft', () => {
    expect(getOrderPermissions('Draft', 0, false)).toMatchObject({
      canAddItem: true,
      canSubmit: false,
      canCancel: true,
    })
    expect(getOrderPermissions('Draft', 1, false).canSubmit).toBe(true)
    expect(getOrderPermissions('Pending', 1, false).canAddItem).toBe(false)
  })

  it('exposes only the valid management transition for each status', () => {
    expect(getOrderPermissions('Pending', 1, true).canConfirm).toBe(true)
    expect(getOrderPermissions('Confirmed', 1, true).canProcess).toBe(true)
    expect(getOrderPermissions('Processing', 1, true).canComplete).toBe(true)
    expect(getOrderPermissions('Completed', 1, true)).toEqual({
      canAddItem: false,
      canSubmit: false,
      canCancel: false,
      canConfirm: false,
      canProcess: false,
      canComplete: false,
    })
  })
})
