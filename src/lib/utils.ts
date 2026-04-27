export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

export function formatDateShort(dateStr: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateStr))
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    new: 'Novo',
    preparing: 'Em Preparo',
    delivering: 'Saiu para Entrega',
    done: 'Finalizado',
  }
  return map[status] ?? status
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800',
    preparing: 'bg-yellow-100 text-yellow-800',
    delivering: 'bg-orange-100 text-orange-800',
    done: 'bg-green-100 text-green-800',
  }
  return map[status] ?? 'bg-gray-100 text-gray-800'
}

export function paymentLabel(method: string): string {
  const map: Record<string, string> = {
    money: 'Dinheiro',
    card: 'Cartao',
    pix: 'PIX',
  }
  return map[method] ?? method
}

export function buildWhatsAppUrl(whatsapp: string, orderSummary: string): string {
  const encoded = encodeURIComponent(orderSummary)
  return `https://wa.me/${whatsapp}?text=${encoded}`
}
