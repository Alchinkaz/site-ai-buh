"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calculator } from "lucide-react"

export function TaxCalculator() {
  const [income, setIncome] = useState("")
  const [taxType, setTaxType] = useState("kpn")
  const [result, setResult] = useState<number | null>(null)

  const calculateTax = () => {
    const amount = Number.parseFloat(income)
    if (isNaN(amount)) return

    let tax = 0
    switch (taxType) {
      case "kpn":
        tax = amount * 0.2 // 20% КПН
        break
      case "nds":
        tax = amount * 0.12 // 12% НДС
        break
      case "ipn":
        tax = amount * 0.1 // 10% ИПН
        break
      case "so":
        tax = amount * 0.035 // 3.5% СО
        break
      case "opv":
        tax = amount * 0.1 // 10% ОПВ
        break
      case "osms":
        tax = amount * 0.02 // 2% ОСМС
        break
    }
    setResult(tax)
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Калькулятор налогов</h3>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="tax-type">Тип налога</Label>
          <Select value={taxType} onValueChange={setTaxType}>
            <SelectTrigger id="tax-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kpn">КПН (20%)</SelectItem>
              <SelectItem value="nds">НДС (12%)</SelectItem>
              <SelectItem value="ipn">ИПН (10%)</SelectItem>
              <SelectItem value="so">СО (3.5%)</SelectItem>
              <SelectItem value="opv">ОПВ (10%)</SelectItem>
              <SelectItem value="osms">ОСМС (2%)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="income">Сумма дохода (₸)</Label>
          <Input
            id="income"
            type="number"
            placeholder="Введите сумму"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
          />
        </div>

        <Button onClick={calculateTax} className="w-full">
          Рассчитать
        </Button>

        {result !== null && (
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm text-muted-foreground mb-1">Сумма налога:</p>
            <p className="text-2xl font-bold text-primary">₸ {result.toLocaleString()}</p>
          </div>
        )}
      </div>
    </Card>
  )
}
