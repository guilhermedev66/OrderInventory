const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' })

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

export function formatDateTime(isoUtc: string): string {
  return dateTimeFormatter.format(new Date(isoUtc))
}

export function formatDate(isoUtc: string): string {
  return dateFormatter.format(new Date(isoUtc))
}
