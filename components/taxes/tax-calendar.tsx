import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "lucide-react"

const upcomingDates = [
  { date: "15 окт", tax: "ИПН", amount: "₸ 40,000", status: "overdue" },
  { date: "20 окт", tax: "КПН", amount: "₸ 164,000", status: "upcoming" },
  { date: "25 окт", tax: "НДС", amount: "₸ 98,400", status: "upcoming" },
  { date: "25 окт", tax: "СО", amount: "₸ 35,000", status: "upcoming" },
  { date: "25 окт", tax: "ОПВ", amount: "₸ 40,000", status: "upcoming" },
  { date: "15 ноя", tax: "ИПН", amount: "₸ 40,000", status: "future" },
  { date: "20 ноя", tax: "КПН", amount: "₸ 164,000", status: "future" },
]

export function TaxCalendar() {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Налоговый календарь</h3>
      </div>

      <div className="space-y-3">
        {upcomingDates.map((item, idx) => (
          <div key={idx} className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-accent/50">
            <div className="text-center min-w-[60px]">
              <p className="text-xs text-muted-foreground">
                {item.date.split(" ")[1].charAt(0).toUpperCase() + item.date.split(" ")[1].slice(1)}
              </p>
              <p className="text-lg font-bold">{item.date.split(" ")[0]}</p>
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{item.tax}</p>
              <p className="text-sm text-muted-foreground">{item.amount}</p>
            </div>
            <Badge
              variant={item.status === "overdue" ? "destructive" : item.status === "upcoming" ? "default" : "secondary"}
            >
              {item.status === "overdue" ? "Просрочен" : item.status === "upcoming" ? "Скоро" : "Запланирован"}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  )
}
