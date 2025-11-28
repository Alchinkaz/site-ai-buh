"use client"

import { useState, useCallback, useEffect } from "react"
import { Employee, NewEmployeeData, UpdateEmployeeData } from "./use-employees"

// Локальные данные для fallback
const fallbackEmployees: Employee[] = [
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
]

export function useEmployeesSafe() {
  const [employees, setEmployees] = useState<Employee[]>(fallbackEmployees)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Загрузка всех сотрудников
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      // Используем локальные данные
      setEmployees(fallbackEmployees)
    } catch (err) {
      console.error('Error fetching employees:', err)
      const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки сотрудников'
      setError(errorMessage)
      setEmployees(fallbackEmployees)
    } finally {
      setLoading(false)
    }
  }, [])

  // Добавление нового сотрудника
  const addEmployee = useCallback(async (newEmployeeData: NewEmployeeData) => {
    try {
      setError(null)
      
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

      setEmployees(prev => [newEmployee, ...prev])
      return newEmployee
    } catch (err) {
      console.error('Error adding employee:', err)
      setError(err instanceof Error ? err.message : 'Ошибка добавления сотрудника')
      throw err
    }
  }, [employees])

  // Обновление сотрудника
  const updateEmployee = useCallback(async (updateData: UpdateEmployeeData) => {
    try {
      setError(null)
      
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
    } catch (err) {
      console.error('Error updating employee:', err)
      setError(err instanceof Error ? err.message : 'Ошибка обновления сотрудника')
      throw err
    }
  }, [])

  // Удаление сотрудника
  const deleteEmployee = useCallback(async (id: number) => {
    try {
      setError(null)
      setEmployees(prev => prev.filter(employee => employee.id !== id))
    } catch (err) {
      console.error('Error deleting employee:', err)
      setError(err instanceof Error ? err.message : 'Ошибка удаления сотрудника')
      throw err
    }
  }, [])

  // Увольнение сотрудника
  const dismissEmployee = useCallback(async (id: number) => {
    try {
      setError(null)
      setEmployees(prev => prev.map(employee => 
        employee.id === id 
          ? {
              ...employee,
              status: "dismissed" as const,
              dismissDate: new Date().toISOString().split('T')[0]
            }
          : employee
      ))
    } catch (err) {
      console.error('Error dismissing employee:', err)
      setError(err instanceof Error ? err.message : 'Ошибка увольнения сотрудника')
      throw err
    }
  }, [])

  // Возврат сотрудника на работу
  const rehireEmployee = useCallback(async (id: number) => {
    try {
      setError(null)
      setEmployees(prev => prev.map(employee => 
        employee.id === id 
          ? {
              ...employee,
              status: "active" as const,
              dismissDate: undefined
            }
          : employee
      ))
    } catch (err) {
      console.error('Error rehiring employee:', err)
      setError(err instanceof Error ? err.message : 'Ошибка возврата сотрудника на работу')
      throw err
    }
  }, [])

  // Загружаем сотрудников при монтировании компонента
  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  return {
    employees,
    loading,
    error,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    dismissEmployee,
    rehireEmployee,
    refetch: fetchEmployees,
  }
}
