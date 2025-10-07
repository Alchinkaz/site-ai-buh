"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, MoreVertical } from "lucide-react"

const products = [
  {
    id: 1,
    name: "Ноутбук Dell XPS 15",
    sku: "DELL-XPS-15",
    category: "Электроника",
    price: 450000,
    stock: 12,
    status: "В наличии",
  },
  {
    id: 2,
    name: "Офисное кресло",
    sku: "CHAIR-001",
    category: "Мебель",
    price: 85000,
    stock: 5,
    status: "Мало",
  },
  {
    id: 3,
    name: "Принтер HP LaserJet",
    sku: "HP-LJ-PRO",
    category: "Электроника",
    price: 120000,
    stock: 0,
    status: "Нет в наличии",
  },
]

export function ProductsTable() {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Товары</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Поиск товаров..." className="pl-9" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Название</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Артикул</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Категория</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Цена</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">Остаток</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">Статус</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-border hover:bg-muted/50">
                  <td className="py-4 px-4 font-medium">{product.name}</td>
                  <td className="py-4 px-4 text-sm text-muted-foreground">{product.sku}</td>
                  <td className="py-4 px-4 text-sm">{product.category}</td>
                  <td className="py-4 px-4 text-right font-medium">{product.price.toLocaleString("ru-KZ")} ₸</td>
                  <td className="py-4 px-4 text-center">{product.stock}</td>
                  <td className="py-4 px-4 text-center">
                    <Badge
                      variant={
                        product.status === "В наличии"
                          ? "default"
                          : product.status === "Мало"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {product.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Редактировать</DropdownMenuItem>
                        <DropdownMenuItem>Изменить цену</DropdownMenuItem>
                        <DropdownMenuItem>История продаж</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Удалить</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
