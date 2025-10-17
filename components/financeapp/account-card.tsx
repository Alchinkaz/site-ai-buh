"use client"

import { formatCurrency } from "@/lib/financeapp/finance-utils"
import type { Account } from "@/lib/financeapp/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Wallet, Building2, Banknote, CreditCard } from "lucide-react"
import Link from "next/link"

interface AccountCardProps {
  account: Account
  transactionCount?: number
}

export function AccountCard({ account, transactionCount = 0 }: AccountCardProps) {
  const getAccountIcon = (type: string) => {
    switch (type) {
      case "bank":
        return <Building2 className="h-5 w-5" />
      case "kaspi":
        return <CreditCard className="h-5 w-5" />
      case "cash":
        return <Banknote className="h-5 w-5" />
      default:
        return <Wallet className="h-5 w-5" />
    }
  }

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case "bank":
        return "Банк"
      case "kaspi":
        return "Kaspi"
      case "cash":
        return "Наличные"
      case "other":
        return "Другое"
      default:
        return type
    }
  }

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-primary/10 p-2 text-primary">{getAccountIcon(account.type)}</div>
          <div>
            <CardTitle className="text-base">
              <span className="block max-w-[160px] truncate" title={account.name}>
                {account.name}
              </span>
            </CardTitle>
            <Badge variant="secondary" className="mt-1 text-xs">
              {getAccountTypeLabel(account.type)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Баланс</p>
            <p className="text-2xl font-bold">{formatCurrency(account.balance, account.currency)}</p>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Транзакций: {transactionCount}</span>
            <Button variant="link" size="sm" asChild className="h-auto p-0">
              <Link href={`/accounts/${account.id}`}>Подробнее →</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


