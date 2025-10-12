"use client"

import { useState, useCallback } from "react"

export interface Employee {
  id: number
  name: string
  position: string
  salary: string
  email: string
  phone: string
  address?: string
  socialMedia?: string
  status: "active" | "pending" | "inactive" | "dismissed"
  workSchedule?: string
  hireDate?: string
  dismissDate?: string
  taxes: {
    ipn: string
    so: string
    opv: string
    osms: string
  }
}

const initialEmployees: Employee[] = [
  {
    id: 1,
    name: "Айгуль Нурланова",
    position: "Главный бухгалтер",
    salary: "₸ 500,000",
    email: "aigul@company.kz",
    phone: "+7 777 123 4567",
    status: "active",
    workSchedule: "full-time",
    hireDate: "2023-01-15",
    taxes: {
      ipn: "₸ 50,000",
      so: "₸ 17,500",
      opv: "₸ 50,000",
      osms: "₸ 10,000",
    },
  },
  {
    id: 2,
    name: "Ерлан Сапаров",
    position: "Финансовый директор",
    salary: "₸ 600,000",
    email: "erlan@company.kz",
    phone: "+7 777 234 5678",
    status: "active",
    workSchedule: "full-time",
    hireDate: "2022-11-20",
    taxes: {
      ipn: "₸ 60,000",
      so: "₸ 21,000",
      opv: "₸ 60,000",
      osms: "₸ 12,000",
    },
  },
  {
    id: 3,
    name: "Динара Касымова",
    position: "Бухгалтер",
    salary: "₸ 350,000",
    email: "dinara@company.kz",
    phone: "+7 777 345 6789",
    status: "active",
    workSchedule: "full-time",
    hireDate: "2023-03-10",
    taxes: {
      ipn: "₸ 35,000",
      so: "₸ 12,250",
      opv: "₸ 35,000",
      osms: "₸ 7,000",
    },
  },
  {
    id: 4,
    name: "Асель Токтарова",
    position: "Помощник бухгалтера",
    salary: "₸ 280,000",
    email: "asel@company.kz",
    phone: "+7 777 456 7890",
    status: "pending",
    workSchedule: "part-time",
    hireDate: "2024-01-05",
    taxes: {
      ipn: "₸ 28,000",
      so: "₸ 9,800",
      opv: "₸ 28,000",
      osms: "₸ 5,600",
    },
  },
  {
    id: 5,
    name: "Марат Кенжебаев",
    position: "Аналитик",
    salary: "₸ 420,000",
    email: "marat@company.kz",
    phone: "+7 777 567 8901",
    status: "active",
    workSchedule: "flexible",
    hireDate: "2023-08-15",
    taxes: {
      ipn: "₸ 42,000",
      so: "₸ 14,700",
      opv: "₸ 42,000",
      osms: "₸ 8,400",
    },
  },
]

export interface NewEmployeeData {
  fullName: string
  position: string
  salary: string
  workSchedule: string
  hireDate: string
  email?: string
  phone: string
  address?: string
  socialMedia?: string
}

export interface UpdateEmployeeData extends NewEmployeeData {
  id: number
}

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees)

  const addEmployee = useCallback((newEmployeeData: NewEmployeeData) => {
    const salaryNumber = Number(newEmployeeData.salary)
    const ipn = Math.round(salaryNumber * 0.1)
    const so = Math.round(salaryNumber * 0.035)
    const opv = Math.round(salaryNumber * 0.1)
    const osms = Math.round(salaryNumber * 0.02)

    const newEmployee: Employee = {
      id: Math.max(...employees.map(e => e.id)) + 1,
      name: newEmployeeData.fullName,
      position: newEmployeeData.position,
      salary: `₸ ${salaryNumber.toLocaleString()}`,
      email: newEmployeeData.email || `${newEmployeeData.fullName.toLowerCase().replace(/\s+/g, '.')}@company.kz`,
      phone: newEmployeeData.phone,
      address: newEmployeeData.address,
      socialMedia: newEmployeeData.socialMedia,
      status: "active",
      workSchedule: newEmployeeData.workSchedule,
      hireDate: newEmployeeData.hireDate,
      taxes: {
        ipn: `₸ ${ipn.toLocaleString()}`,
        so: `₸ ${so.toLocaleString()}`,
        opv: `₸ ${opv.toLocaleString()}`,
        osms: `₸ ${osms.toLocaleString()}`,
      },
    }

    setEmployees(prev => [...prev, newEmployee])
    return newEmployee
  }, [employees])

  const updateEmployee = useCallback((updateData: UpdateEmployeeData) => {
    const salaryNumber = Number(updateData.salary)
    const ipn = Math.round(salaryNumber * 0.1)
    const so = Math.round(salaryNumber * 0.035)
    const opv = Math.round(salaryNumber * 0.1)
    const osms = Math.round(salaryNumber * 0.02)

    setEmployees(prev => prev.map(employee => 
      employee.id === updateData.id 
        ? {
            ...employee,
            name: updateData.fullName,
            position: updateData.position,
            salary: `₸ ${salaryNumber.toLocaleString()}`,
            email: updateData.email || `${updateData.fullName.toLowerCase().replace(/\s+/g, '.')}@company.kz`,
            phone: updateData.phone,
            address: updateData.address,
            socialMedia: updateData.socialMedia,
            workSchedule: updateData.workSchedule,
            hireDate: updateData.hireDate,
            taxes: {
              ipn: `₸ ${ipn.toLocaleString()}`,
              so: `₸ ${so.toLocaleString()}`,
              opv: `₸ ${opv.toLocaleString()}`,
              osms: `₸ ${osms.toLocaleString()}`,
            },
          }
        : employee
    ))
  }, [])

  const deleteEmployee = useCallback((id: number) => {
    setEmployees(prev => prev.filter(employee => employee.id !== id))
  }, [])

  const dismissEmployee = useCallback((id: number) => {
    setEmployees(prev => prev.map(employee => 
      employee.id === id 
        ? {
            ...employee,
            status: "dismissed" as const,
            dismissDate: new Date().toISOString().split('T')[0]
          }
        : employee
    ))
  }, [])

  return {
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    dismissEmployee,
  }
}
