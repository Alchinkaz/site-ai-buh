"use client"

import React, { useState } from "react"
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
import { NewEmployeeData, UpdateEmployeeData, Employee } from "@/hooks/use-employees"

const employeeSchema = z.object({
  fullName: z.string().min(2, "ФИО должно содержать минимум 2 символа"),
  position: z.string().min(1, "Должность обязательна"),
  salary: z.string().min(1, "Зарплата обязательна").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Зарплата должна быть положительным числом"
  ),
  workSchedule: z.string().min(1, "График работы обязателен"),
  hireDate: z.string().min(1, "Дата приема обязательна"),
  email: z.string().email("Некорректный email адрес"),
  phone: z.string().min(1, "Номер телефона обязателен"),
  address: z.string().optional(),
  socialMedia: z.string().optional(),
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
  onEmployeeUpdate?: (employee: UpdateEmployeeData) => void
  editingEmployee?: Employee | null
  trigger?: React.ReactNode
}

export function AddEmployeeForm({ 
  onEmployeeAdd, 
  onEmployeeUpdate, 
  editingEmployee, 
  trigger 
}: AddEmployeeFormProps) {
  const [open, setOpen] = useState(false)
  const isEditing = !!editingEmployee

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      fullName: editingEmployee?.name || "",
      position: editingEmployee?.position || "",
      salary: editingEmployee?.salary.replace(/[^\d]/g, "") || "",
      workSchedule: editingEmployee?.workSchedule || "",
      hireDate: editingEmployee?.hireDate || "",
      email: editingEmployee?.email || "",
      phone: editingEmployee?.phone || "",
      address: editingEmployee?.address || "",
      socialMedia: editingEmployee?.socialMedia || "",
    },
  })

  // Обновляем форму при изменении редактируемого сотрудника
  React.useEffect(() => {
    if (editingEmployee) {
      form.reset({
        fullName: editingEmployee.name,
        position: editingEmployee.position,
        salary: editingEmployee.salary.replace(/[^\d]/g, ""),
        workSchedule: editingEmployee.workSchedule || "",
        hireDate: editingEmployee.hireDate || "",
        email: editingEmployee.email,
        phone: editingEmployee.phone,
        address: editingEmployee.address || "",
        socialMedia: editingEmployee.socialMedia || "",
      })
    } else {
      form.reset({
        fullName: "",
        position: "",
        salary: "",
        workSchedule: "",
        hireDate: "",
        email: "",
        phone: "",
        address: "",
        socialMedia: "",
      })
    }
  }, [editingEmployee, form])

  const onSubmit = (data: EmployeeFormData) => {
    if (isEditing && editingEmployee) {
      onEmployeeUpdate?.({ ...data, id: editingEmployee.id })
    } else {
      onEmployeeAdd?.(data)
    }
    form.reset()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Добавить сотрудника
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Редактировать сотрудника" : "Добавить нового сотрудника"}
          </DialogTitle>
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
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Должность</FormLabel>
                  <FormControl>
                    <Input placeholder="Введите должность" {...field} />
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

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="example@company.kz" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Номер телефона</FormLabel>
                  <FormControl>
                    <Input 
                      type="tel" 
                      placeholder="+7 777 123 4567" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Адрес (необязательно)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Введите адрес" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="socialMedia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Социальные сети (необязательно)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Instagram, Telegram, LinkedIn и т.д." 
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
                {isEditing ? "Сохранить изменения" : "Добавить сотрудника"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
