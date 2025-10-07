"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Warehouse, MapPin, Package, TrendingUp } from "lucide-react"

const warehouses = [
  {
    id: 1,
    name: "Главный склад",
    address: "г. Алматы, ул. Абая 150",
    capacity: 1000,
    occupied: 756,
    products: 234,
    status: "Активный",
  },
  {
    id: 2,
    name: "Склад №2",
    address: "г. Астана, пр. Кабанбай батыра 45",
    capacity: 500,
    occupied: 423,
    products: 156,
    status: "Активный",
  },
  {
    id: 3,
    name: "Временный склад",
    address: "г. Шымкент, ул. Байтурсынова 12",
    capacity: 200,
    occupied: 45,
    products: 34,
    status: "Временный",
  },
]

export function WarehousesList() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {warehouses.map((warehouse) => {
        const occupancyPercent = (warehouse.occupied / warehouse.capacity) * 100
        return (
          <Card key={warehouse.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Warehouse className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                    <Badge variant={warehouse.status === "Активный" ? "default" : "secondary"} className="mt-1">
                      {warehouse.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                {warehouse.address}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Заполненность</span>
                  <span className="font-medium">
                    {warehouse.occupied} / {warehouse.capacity} м²
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${occupancyPercent > 80 ? "bg-red-500" : occupancyPercent > 60 ? "bg-orange-500" : "bg-green-500"}`}
                    style={{ width: `${occupancyPercent}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Товаров</div>
                    <div className="font-semibold">{warehouse.products}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Оборот</div>
                    <div className="font-semibold">{Math.round(occupancyPercent)}%</div>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full bg-transparent">
                Подробнее
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
