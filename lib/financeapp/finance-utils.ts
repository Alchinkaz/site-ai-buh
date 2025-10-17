import type { Transaction, Invoice, Account, DashboardMetrics } from "./types"

export function calculateDashboardMetrics(
  transactions: Transaction[],
  invoices: Invoice[],
  accounts: Account[],
  startDate?: string,
  endDate?: string,
): DashboardMetrics {
  const filteredTransactions = transactions.filter((t) => {
    if (startDate && t.date < startDate) return false
    if (endDate && t.date > endDate) return false
    return true
  })

  const filteredInvoices = invoices.filter((i) => {
    if (startDate && i.issueDate < startDate) return false
    if (endDate && i.issueDate > endDate) return false
    return true
  })

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)
  const turnover = filteredInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0)
  const revenue = filteredTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
  const expenses = filteredTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)
  const profit = revenue - expenses
  const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0

  return { totalBalance, turnover, revenue, expenses, profit, profitMargin }
}

export function formatCurrency(amount: number, currency = "KZT"): string {
  const formatted = Math.abs(amount)
    .toFixed(0)
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ")
  return `${formatted} ${currency}`
}

export function formatDate(date: string): string {
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, "0")
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const year = d.getFullYear()
  return `${day}.${month}.${year}`
}


