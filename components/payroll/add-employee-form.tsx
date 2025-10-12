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
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Plus } from "lucide-react"
import { NewEmployeeData, UpdateEmployeeData, Employee } from "@/hooks/use-employees"
import { EmployeeCategory, AdditionalDeduction, getEmployeeCategoryLabel, getAdditionalDeductionLabel } from "@/lib/payroll-calculator"

const employeeSchema = z.object({
  fullName: z.string().min(2, "ФИО должно содержать минимум 2 символа"),
  position: z.string().min(1, "Должность обязательна"),
  salary: z.string().min(1, "Зарплата обязательна").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Зарплата должна быть положительным числом"
  ),
  workSchedule: z.string().min(1, "График работы обязателен"),
  hireDate: z.string().min(1, "Дата приема обязательна"),
  email: z.string().email("Некорректный email адрес").optional().or(z.literal("")),
  phone: z.string().min(1, "Номер телефона обязателен"),
  address: z.string().optional(),
  socialMedia: z.string().optional(),
  category: z.string().min(1, "Категория сотрудника обязательна"),
  harmfulWork: z.boolean().optional(),
  additionalDeductions: z.array(z.string()).optional(),
  educationExpenses: z.string().optional(),
  medicalExpenses: z.string().optional(),
  mortgagePayments: z.string().optional(),
  dpvAmount: z.string().optional(),
})

type EmployeeFormData = z.infer<typeof employeeSchema>

const workSchedules = [
  { value: "full-time", label: "Полный рабочий день (8 часов)" },
  { value: "part-time", label: "Неполный рабочий день (4 часа)" },
  { value: "flexible", label: "Гибкий график" },
  { value: "shift", label: "Сменный график" },
  { value: "remote", label: "Удаленная работа" },
]

const employeeCategories: { value: EmployeeCategory; label: string }[] = [
  { value: "standard", label: "Обычный сотрудник" },
  { value: "pensioner_age", label: "Пенсионер по возрасту" },
  { value: "pensioner_service", label: "Пенсионер за выслугу лет" },
  { value: "disabled_1_2", label: "Инвалид I, II группы (бессрочно)" },
  { value: "disabled_2_temp", label: "Инвалид II группы (справка до 2027 г.)" },
  { value: "disabled_3", label: "Инвалид III группы" },
  { value: "parent_disabled_child", label: "Родитель ребенка с инвалидностью" },
  { value: "foreigner_resident", label: "Иностранец с ВНЖ" },
  { value: "foreigner_eaeu_permanent", label: "Иностранец из ЕАЭС, постоянно пребывающий" },
  { value: "foreigner_eaeu_temporary", label: "Иностранец из ЕАЭС, временно пребывающий" },
  { value: "foreigner_remote", label: "Иностранец, работающий дистанционно" },
  { value: "foreigner_third_permanent", label: "Иностранец из третьих стран, постоянно пребывающий" },
  { value: "foreigner_third_temporary", label: "Иностранец из третьих стран, временно пребывающий" },
]

const additionalDeductions: { value: AdditionalDeduction; label: string }[] = [
  { value: "disability", label: "Вычет для инвалидов" },
  { value: "chernobyl", label: "Вычет для чернобыльцев/афганцев" },
  { value: "child_disability", label: "Вычет для родителей детей с инвалидностью" },
  { value: "multichild", label: "Вычет для многодетных семей" },
  { value: "education", label: "Вычет на обучение" },
  { value: "medical", label: "Вычет на мед. услуги" },
  { value: "mortgage", label: "Вычет на ипотеку" },
  { value: "dpv", label: "Вычет по добровольным пенсионным взносам" },
]

interface AddEmployeeFormProps {
  onEmployeeAdd?: (employee: NewEmployeeData) => void
  onEmployeeUpdate?: (employee: UpdateEmployeeData) => void
  editingEmployee?: Employee | null
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AddEmployeeForm({ 
  onEmployeeAdd, 
  onEmployeeUpdate, 
  editingEmployee, 
  trigger,
  open: externalOpen,
  onOpenChange: externalOnOpenChange
}: AddEmployeeFormProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isEditing = !!editingEmployee
  
  // Используем внешнее состояние, если оно предоставлено, иначе внутреннее
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = externalOnOpenChange || setInternalOpen

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
      category: "standard",
      harmfulWork: false,
      additionalDeductions: [],
      educationExpenses: "",
      medicalExpenses: "",
      mortgagePayments: "",
      dpvAmount: "",
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
        category: "standard",
        harmfulWork: false,
        additionalDeductions: [],
        educationExpenses: "",
        medicalExpenses: "",
        mortgagePayments: "",
        dpvAmount: "",
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
        category: "standard",
        harmfulWork: false,
        additionalDeductions: [],
        educationExpenses: "",
        medicalExpenses: "",
        mortgagePayments: "",
        dpvAmount: "",
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
                  <FormLabel>Email (необязательно)</FormLabel>
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

            <Separator className="my-6" />
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Категория и льготы</h3>
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Категория сотрудника</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите категорию сотрудника" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employeeCategories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
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
                name="harmfulWork"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Вредные условия труда
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Отметьте, если сотрудник работает во вредных условиях
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="additionalDeductions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Дополнительные налоговые вычеты</FormLabel>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {additionalDeductions.map((deduction) => (
                        <div key={deduction.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={deduction.value}
                            checked={field.value?.includes(deduction.value)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange([...(field.value || []), deduction.value])
                              } else {
                                field.onChange(field.value?.filter(item => item !== deduction.value))
                              }
                            }}
                          />
                          <label
                            htmlFor={deduction.value}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {deduction.label}
                          </label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator className="my-6" />
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Дополнительные расходы для вычетов</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="educationExpenses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Расходы на обучение (₸)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="medicalExpenses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Расходы на мед. услуги (₸)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mortgagePayments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Платежи по ипотеке (₸)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dpvAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Добровольные пенсионные взносы (₸)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
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
