"use client"

import { useState, useCallback, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Employee, NewEmployeeData, UpdateEmployeeData } from "./use-employees"

export function useEmployeesSupabase() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Функция для преобразования данных из Supabase в формат приложения
  const transformEmployeeFromDB = (dbEmployee: any): Employee => {
    const salaryNumber = dbEmployee.salary
    const ipn = Math.round(salaryNumber * 0.1)
    const so = Math.round(salaryNumber * 0.035)
    const opv = Math.round(salaryNumber * 0.1)
    const osms = Math.round(salaryNumber * 0.02)

    return {
      id: dbEmployee.id,
      name: dbEmployee.name,
      position: dbEmployee.position,
      salary: `₸ ${salaryNumber.toLocaleString()}`,
      email: dbEmployee.email,
      phone: dbEmployee.phone,
      address: dbEmployee.address,
      socialMedia: dbEmployee.social_media,
      status: dbEmployee.status,
      workSchedule: dbEmployee.work_schedule,
      hireDate: dbEmployee.hire_date,
      dismissDate: dbEmployee.dismiss_date,
      taxes: {
        ipn: `₸ ${ipn.toLocaleString()}`,
        so: `₸ ${so.toLocaleString()}`,
        opv: `₸ ${opv.toLocaleString()}`,
        osms: `₸ ${osms.toLocaleString()}`,
      },
    }
  }

  // Функция для преобразования данных приложения в формат Supabase
  const transformEmployeeToDB = (employee: NewEmployeeData | UpdateEmployeeData) => {
    return {
      name: employee.fullName,
      position: employee.position,
      salary: Number(employee.salary),
      email: employee.email || `${employee.fullName.toLowerCase().replace(/\s+/g, '.')}@company.kz`,
      phone: employee.phone,
      address: employee.address || null,
      social_media: employee.socialMedia || null,
      work_schedule: employee.workSchedule,
      hire_date: employee.hireDate,
    }
  }

  // Загрузка всех сотрудников
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Attempting to fetch employees from Supabase...')
      
      const { data, error: fetchError } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('Supabase response:', { data, error: fetchError })

      if (fetchError) {
        console.error('Supabase fetch error:', fetchError)
        throw fetchError
      }

      const transformedEmployees = data?.map(transformEmployeeFromDB) || []
      console.log('Transformed employees:', transformedEmployees)
      setEmployees(transformedEmployees)
    } catch (err) {
      console.error('Error fetching employees:', err)
      const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки сотрудников'
      console.error('Setting error message:', errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  // Добавление нового сотрудника
  const addEmployee = useCallback(async (newEmployeeData: NewEmployeeData) => {
    try {
      setError(null)
      
      const employeeData = transformEmployeeToDB(newEmployeeData)
      
      const { data, error: insertError } = await supabase
        .from('employees')
        .insert([employeeData])
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      const newEmployee = transformEmployeeFromDB(data)
      setEmployees(prev => [newEmployee, ...prev])
      return newEmployee
    } catch (err) {
      console.error('Error adding employee:', err)
      setError(err instanceof Error ? err.message : 'Ошибка добавления сотрудника')
      throw err
    }
  }, [])

  // Обновление сотрудника
  const updateEmployee = useCallback(async (updateData: UpdateEmployeeData) => {
    try {
      setError(null)
      
      const employeeData = transformEmployeeToDB(updateData)
      
      const { data, error: updateError } = await supabase
        .from('employees')
        .update(employeeData)
        .eq('id', updateData.id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      const updatedEmployee = transformEmployeeFromDB(data)
      setEmployees(prev => prev.map(employee => 
        employee.id === updateData.id ? updatedEmployee : employee
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
      
      const { error: deleteError } = await supabase
        .from('employees')
        .delete()
        .eq('id', id)

      if (deleteError) {
        throw deleteError
      }

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
      
      const dismissDate = new Date().toISOString().split('T')[0]
      
      const { data, error: updateError } = await supabase
        .from('employees')
        .update({ 
          status: 'dismissed',
          dismiss_date: dismissDate
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      const updatedEmployee = transformEmployeeFromDB(data)
      setEmployees(prev => prev.map(employee => 
        employee.id === id ? updatedEmployee : employee
      ))
    } catch (err) {
      console.error('Error dismissing employee:', err)
      setError(err instanceof Error ? err.message : 'Ошибка увольнения сотрудника')
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
    refetch: fetchEmployees,
  }
}
