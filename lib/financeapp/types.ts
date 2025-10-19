export type TransactionType = "income" | "expense" | "transfer"

export interface Account {
  id: string
  name: string
  type: "bank" | "cash" | "kaspi" | "other"
  balance: number
  currency: string
  accountNumber?: string
  createdAt: string
}

export interface Category {
  id: string
  name: string
  type: "income" | "expense" | "transfer"
  color: string
}

export interface Counterparty {
  id: string
  name: string
  type: "client" | "supplier" | "partner"
  email?: string
  phone?: string
}

export interface Project {
  id: string
  name: string
  description?: string
}

export interface Transaction {
  id: string
  date: string
  amount: number
  currency: string
  type: TransactionType
  accountId: string
  toAccountId?: string
  categoryId: string
  counterpartyId?: string
  projectId?: string
  invoiceId?: string
  comment?: string
  createdAt: string
  documentNumber?: string
}

export interface InvoiceStatus {
  status: "draft" | "sent" | "paid" | "partial" | "overdue" | "cancelled"
}

export interface Invoice {
  id: string
  number: string
  counterpartyId: string
  totalAmount: number
  paidAmount: number
  currency: string
  status: InvoiceStatus["status"]
  issueDate: string
  dueDate?: string
  items: InvoiceItem[]
  comment?: string
  createdAt: string
}

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface DashboardMetrics {
  totalBalance: number
  turnover: number
  revenue: number
  expenses: number
  profit: number
  profitMargin: number
}

export interface FinanceContextType {
  accounts: Account[]
  categories: Category[]
  counterparties: Counterparty[]
  projects: Project[]
  transactions: Transaction[]
  invoices: Invoice[]
  addAccount: (account: Omit<Account, "id" | "createdAt">) => void
  addCategory: (category: Omit<Category, "id">) => void
  addCounterparty: (counterparty: Omit<Counterparty, "id">) => Counterparty
  addProject: (project: Omit<Project, "id">) => void
  addTransaction: (transaction: Omit<Transaction, "id" | "createdAt">) => void
  addInvoice: (invoice: Omit<Invoice, "id" | "createdAt">) => void
  updateAccount: (id: string, updates: Partial<Account>) => void
  deleteAccount: (id: string) => void
  updateCategory: (id: string, updates: Partial<Category>) => void
  deleteCategory: (id: string) => void
  updateCounterparty: (id: string, updates: Partial<Counterparty>) => void
  deleteCounterparty: (id: string) => void
  updateTransaction: (id: string, updates: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void
  updateInvoice: (id: string, updates: Partial<Invoice>) => void
  deleteInvoice: (id: string) => void
}


