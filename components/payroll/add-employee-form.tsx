"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { NewEmployeeData } from "@/hooks/use-employees"

const employeeSchema = z.object({
  fullName: z.string().min(2, "ФИО должно содержать минимум 2 символа"),
  salary: z.string().min(1, "Зарплата обязательна").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Зарплата должна быть положительным числом"
  ),
  workSchedule: z.string().min(1, "График работы обязателен"),
  hireDate: z.string().min(1, "Дата приема обязательна"),
})

type EmployeeFormData = z.infer<typeof employeeSchema>

const workSchedules = [
  { value: "full-time", label: "Полный рабочий день (8 часов)" },
  { value: "part-time", label: "Неполный рабочий день (4 часа)" },
  { value: "flexible", label: "Гибкий график" },
  { value: "shift", label: "Сменный график" },
  { value: "remote", label: "Удаленная работа" },
]

interface AddEmployeeFormProps {
  onEmployeeAdd?: (employee: NewEmployeeData) => void
}

export function AddEmployeeForm({ onEmployeeAdd }: AddEmployeeFormProps) {
  const [open, setOpen] = useState(false)

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      fullName: "",
      salary: "",
      workSchedule: "",
      hireDate: "",
    },
  })

  const onSubmit = (data: EmployeeFormData) => {
    console.log("Новый сотрудник:", data)
    onEmployeeAdd?.(data)
    form.reset()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Добавить сотрудника
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Добавить нового сотрудника</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ФИО сотрудника</FormLabel>
                  <FormControl>
                    <Input placeholder="Введите ФИО сотрудника" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="salary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Заработная плата (₸)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Введите размер зарплаты" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="workSchedule"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>График работы</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите график работы" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {workSchedules.map((schedule) => (
                        <SelectItem key={schedule.value} value={schedule.value}>
                          {schedule.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="hireDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Дата приема на работу</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
              >
                Отмена
              </Button>
              <Button type="submit">
                Добавить сотрудника
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
