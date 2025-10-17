"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef } from "react"
import type { Account, Category, Counterparty, Project, Transaction, Invoice } from "./types"
import type { FinanceContextType } from "./types"

const FinanceContext = createContext<FinanceContextType | undefined>(undefined)

const STORAGE_KEY = "finance-app-data"

const defaultCategories: Category[] = [
  { id: "1", name: "Продажи", type: "income", color: "#10b981" },
  { id: "2", name: "Услуги", type: "income", color: "#3b82f6" },
  { id: "3", name: "Аренда", type: "expense", color: "#ef4444" },
  { id: "4", name: "Зарплата", type: "expense", color: "#f59e0b" },
  { id: "5", name: "Реклама", type: "expense", color: "#8b5cf6" },
  { id: "6", name: "Офис", type: "expense", color: "#ec4899" },
  { id: "7", name: "Налоги", type: "expense", color: "#6366f1" },
]

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const isInitialized = useRef(false)

  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>(defaultCategories)
  const [counterparties, setCounterparties] = useState<Counterparty[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null
    if (stored) {
      try {
        const data = JSON.parse(stored)
        setAccounts(data.accounts || [])
        setCategories(data.categories || defaultCategories)
        setCounterparties(data.counterparties || [])
        setProjects(data.projects || [])
        setTransactions(data.transactions || [])
        setInvoices(data.invoices || [])
      } catch (e) {
        console.error("Failed to load data from localStorage", e)
      }
    }
    setTimeout(() => {
      isInitialized.current = true
    }, 100)
  }, [])

  useEffect(() => {
    if (!isInitialized.current) return
    try {
      const data = { accounts, categories, counterparties, projects, transactions, invoices }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error("Failed to save to localStorage:", error)
    }
  }, [accounts, categories, counterparties, projects, transactions, invoices])

  const addAccount = (account: Omit<Account, "id" | "createdAt">) => {
    const newAccount: Account = { ...account, id: generateId(), createdAt: new Date().toISOString() }
    setAccounts((prev) => [...prev, newAccount])
  }

  const addCategory = (category: Omit<Category, "id">) => {
    const newCategory: Category = { ...category, id: generateId() }
    setCategories((prev) => [...prev, newCategory])
  }

  const addCounterparty = (counterparty: Omit<Counterparty, "id">): Counterparty => {
    const newCounterparty: Counterparty = { ...counterparty, id: generateId() }
    setCounterparties((prev) => [...prev, newCounterparty])
    return newCounterparty
  }

  const addProject = (project: Omit<Project, "id">) => {
    const newProject: Project = { ...project, id: generateId() }
    setProjects((prev) => [...prev, newProject])
  }

  const addTransaction = (transaction: Omit<Transaction, "id" | "createdAt">) => {
    const newTransaction: Transaction = { ...transaction, id: generateId(), createdAt: new Date().toISOString() }
    setTransactions((prev) => [...prev, newTransaction])

    if (transaction.type === "transfer") {
      if (!transaction.toAccountId) return
      setAccounts((prevAccounts) =>
        prevAccounts.map((account) => {
          if (account.id === transaction.accountId) {
            return { ...account, balance: account.balance - transaction.amount }
          }
          if (account.id === transaction.toAccountId) {
            return { ...account, balance: account.balance + transaction.amount }
          }
          return account
        }),
      )
    } else {
      setAccounts((prevAccounts) =>
        prevAccounts.map((account) => {
          if (account.id === transaction.accountId) {
            const change = transaction.type === "income" ? transaction.amount : -transaction.amount
            return { ...account, balance: account.balance + change }
          }
          return account
        }),
      )
    }
  }

  const addInvoice = (invoice: Omit<Invoice, "id" | "createdAt">) => {
    const newInvoice: Invoice = { ...invoice, id: generateId(), createdAt: new Date().toISOString() }
    setInvoices((prev) => [...prev, newInvoice])
  }

  const updateAccount = (id: string, updates: Partial<Account>) => {
    setAccounts((prev) => prev.map((account) => (account.id === id ? { ...account, ...updates } : account)))
  }

  const deleteAccount = (id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id))
  }

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories((prev) => prev.map((category) => (category.id === id ? { ...category, ...updates } : category)))
  }

  const updateCounterparty = (id: string, updates: Partial<Counterparty>) => {
    setCounterparties((prev) => prev.map((counterparty) => (counterparty.id === id ? { ...counterparty, ...updates } : counterparty)))
  }

  const deleteCounterparty = (id: string) => {
    setCounterparties((prev) => prev.filter((c) => c.id !== id))
  }

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    const oldTransaction = transactions.find((t) => t.id === id)
    if (!oldTransaction) return

    // First, reverse the old transaction's effect on account balances
    if (oldTransaction.type === "transfer" && oldTransaction.toAccountId) {
      setAccounts((prevAccounts) =>
        prevAccounts.map((account) => {
          if (account.id === oldTransaction.accountId) {
            return { ...account, balance: account.balance + oldTransaction.amount }
          }
          if (account.id === oldTransaction.toAccountId) {
            return { ...account, balance: account.balance - oldTransaction.amount }
          }
          return account
        }),
      )
    } else {
      setAccounts((prevAccounts) =>
        prevAccounts.map((account) => {
          if (account.id === oldTransaction.accountId) {
            const change = oldTransaction.type === "income" ? -oldTransaction.amount : oldTransaction.amount
            return { ...account, balance: account.balance + change }
          }
          return account
        }),
      )
    }

    // Update the transaction
    const updatedTransaction = { ...oldTransaction, ...updates }
    setTransactions((prev) => prev.map((transaction) => (transaction.id === id ? updatedTransaction : transaction)))

    // Apply the new transaction's effect on account balances
    if (updatedTransaction.type === "transfer" && updatedTransaction.toAccountId) {
      setAccounts((prevAccounts) =>
        prevAccounts.map((account) => {
          if (account.id === updatedTransaction.accountId) {
            return { ...account, balance: account.balance - updatedTransaction.amount }
          }
          if (account.id === updatedTransaction.toAccountId) {
            return { ...account, balance: account.balance + updatedTransaction.amount }
          }
          return account
        }),
      )
    } else {
      setAccounts((prevAccounts) =>
        prevAccounts.map((account) => {
          if (account.id === updatedTransaction.accountId) {
            const change = updatedTransaction.type === "income" ? updatedTransaction.amount : -updatedTransaction.amount
            return { ...account, balance: account.balance + change }
          }
          return account
        }),
      )
    }
  }

  const updateInvoice = (id: string, updates: Partial<Invoice>) => {
    setInvoices((prev) => prev.map((invoice) => (invoice.id === id ? { ...invoice, ...updates } : invoice)))
  }

  const deleteTransaction = (id: string) => {
    const transaction = transactions.find((t) => t.id === id)
    if (!transaction) return

    if (transaction.type === "transfer" && transaction.toAccountId) {
      setAccounts((prevAccounts) =>
        prevAccounts.map((account) => {
          if (account.id === transaction.accountId) {
            return { ...account, balance: account.balance + transaction.amount }
          }
          if (account.id === transaction.toAccountId) {
            return { ...account, balance: account.balance - transaction.amount }
          }
          return account
        }),
      )
    } else {
      setAccounts((prevAccounts) =>
        prevAccounts.map((account) => {
          if (account.id === transaction.accountId) {
            const change = transaction.type === "income" ? -transaction.amount : transaction.amount
            return { ...account, balance: account.balance + change }
          }
          return account
        }),
      )
    }

    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }

  const deleteInvoice = (id: string) => {
    setInvoices((prev) => prev.filter((i) => i.id !== id))
  }

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <FinanceContext.Provider
      value={{
        accounts,
        categories,
        counterparties,
        projects,
        transactions,
        invoices,
        addAccount,
        addCategory,
        addCounterparty,
        addProject,
        addTransaction,
        addInvoice,
        updateAccount,
        deleteAccount,
        updateCategory,
        updateCounterparty,
        updateTransaction,
        updateInvoice,
        deleteCategory,
        deleteCounterparty,
        deleteTransaction,
        deleteInvoice,
      }}
    >
      {children}
    </FinanceContext.Provider>
  )
}

export function useFinance() {
  const context = useContext(FinanceContext)
  if (!context) throw new Error("useFinance must be used within FinanceProvider")
  return context
}


