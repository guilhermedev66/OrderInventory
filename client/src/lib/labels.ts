import type { OrderStatus, StockMovementType } from '@/types/api'

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  Draft: 'Rascunho',
  Pending: 'Pendente',
  Confirmed: 'Confirmado',
  Processing: 'Em processamento',
  Completed: 'Concluído',
  Cancelled: 'Cancelado',
}

export const ORDER_STATUS_TONE: Record<OrderStatus, 'neutral' | 'success' | 'danger' | 'warning' | 'info'> = {
  Draft: 'neutral',
  Pending: 'warning',
  Confirmed: 'info',
  Processing: 'info',
  Completed: 'success',
  Cancelled: 'danger',
}

export const MOVEMENT_TYPE_LABEL: Record<StockMovementType, string> = {
  Received: 'Recebimento',
  Reserved: 'Reserva',
  ReservationReleased: 'Reserva liberada',
  Fulfilled: 'Atendimento',
}

export const MOVEMENT_TYPE_TONE: Record<StockMovementType, 'neutral' | 'success' | 'danger' | 'warning' | 'info'> = {
  Received: 'success',
  Reserved: 'warning',
  ReservationReleased: 'info',
  Fulfilled: 'neutral',
}

export const ROLE_LABEL: Record<string, string> = {
  User: 'Usuário',
  Manager: 'Gerente',
  Admin: 'Administrador',
}
