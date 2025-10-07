"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Sparkles } from "lucide-react"

const plans = [
  {
    name: "Бесплатный",
    price: "0 ₸",
    period: "навсегда",
    description: "Для начинающих предпринимателей",
    features: ["Ручной ввод данных", "До 50 документов в месяц", "Базовые отчеты", "1 пользователь", "Email поддержка"],
    limitations: ["Без ИИ-ассистента", "Без автоматизации", "Без интеграций"],
    current: true,
  },
  {
    name: "Стандарт",
    price: "15,000 ₸",
    period: "в месяц",
    description: "Для малого бизнеса",
    features: [
      "ИИ-ассистент (1000 токенов/мес)",
      "Неограниченные документы",
      "Все виды отчетов",
      "До 5 пользователей",
      "Интеграция с банками",
      "Автоматическое создание ЭСФ",
      "Приоритетная поддержка",
    ],
    popular: true,
  },
  {
    name: "Премиум",
    price: "35,000 ₸",
    period: "в месяц",
    description: "Для среднего бизнеса",
    features: [
      "ИИ-ассистент (5000 токенов/мес)",
      "Все функции Стандарт",
      "До 20 пользователей",
      "Интеграция с 1С",
      "Интеграция с CRM",
      "Голосовой ввод",
      "Мультикомпания",
      "Персональный менеджер",
      "24/7 поддержка",
    ],
  },
]

export function PricingPlans() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {plans.map((plan) => (
        <Card key={plan.name} className={plan.popular ? "border-primary shadow-lg" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{plan.name}</CardTitle>
              {plan.popular && (
                <Badge className="gap-1">
                  <Sparkles className="w-3 h-3" />
                  Популярный
                </Badge>
              )}
              {plan.current && <Badge variant="secondary">Текущий</Badge>}
            </div>
            <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
            <div className="mt-4">
              <span className="text-4xl font-bold">{plan.price}</span>
              <span className="text-muted-foreground ml-2">{plan.period}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" variant={plan.current ? "outline" : "default"}>
              {plan.current ? "Текущий план" : "Выбрать план"}
            </Button>

            <div className="space-y-2">
              {plan.features.map((feature) => (
                <div key={feature} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
              {plan.limitations?.map((limitation) => (
                <div key={limitation} className="flex items-start gap-2">
                  <div className="w-5 h-5 shrink-0 mt-0.5 flex items-center justify-center">
                    <div className="w-3 h-0.5 bg-muted-foreground rounded" />
                  </div>
                  <span className="text-sm text-muted-foreground">{limitation}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
