/**
 * Модуль расчета заработной платы согласно законодательству Казахстана 2025 года
 * Основан на данных из статьи: https://www.1cbit.kz/blog/raschet-zarabotnoy-platy-v-2025-godu-chto-izmenilos-i-kak-pravilno-schitat/
 */

// Константы для расчета на 2025 год
export const PAYROLL_CONSTANTS_2025 = {
  // Минимальные расчетные показатели
  MRP: 3932, // 1 МРП = 3 932 тенге в 2025 году
  
  // Минимальная заработная плата
  MZP: 85000, // МЗП = 85 000 тенге в 2025 году
  
  // Ставки налогов и взносов
  RATES: {
    IPN: 0.10,        // Подоходный налог - 10%
    OPV: 0.10,        // Обязательные пенсионные взносы - 10% (до 50 МЗП)
    VOSMS: 0.02,     // Взносы на обязательное соц. мед. страхование - 2% (до 10 МЗП)
    OOSMS: 0.03,     // Отчисления на обязательное соц. мед. страхование - 3% (до 10 МЗП)
    SO: 0.05,        // Социальные отчисления - 5% (от 1 до 7 МЗП)
    SN: 0.11,        // Социальный налог - 11% (с учетом СО)
    OPPV: 0.05,      // Профессиональные пенсионные взносы - 5% (для вредных профессий)
    OPVR: 0.025,     // Обязательные пенсионные взносы работодателя - 2,5% (от 1 до 50 МЗП)
  },
  
  // Лимиты доходов
  LIMITS: {
    OPV_MAX: 50,     // ОПВ до 50 МЗП
    VOSMS_MAX: 10,   // ВОСМС до 10 МЗП
    OOSMS_MAX: 10,   // ООСМС до 10 МЗП
    SO_MIN: 1,       // СО от 1 МЗП
    SO_MAX: 7,       // СО до 7 МЗП
    OPVR_MIN: 1,     // ОПВР от 1 МЗП
    OPVR_MAX: 50,    // ОПВР до 50 МЗП
    SN_MIN: 14,      // СН не менее 14 МРП
  },
  
  // Налоговые вычеты
  DEDUCTIONS: {
    STANDARD_MRP: 14,        // Стандартный вычет - 14 МРП в месяц
    DISABILITY_MRP: 882,     // Вычет для инвалидов - 882 МРП в год
    CHERNOBYL_MRP: 882,      // Вычет для чернобыльцев/афганцев - 882 МРП в год
    CHILD_DISABILITY_MRP: 282, // Вычет для родителей детей с инвалидностью - 282 МРП в год
    MULTICHILD_MRP: 282,     // Вычет для многодетных семей - 282 МРП в год
    EDUCATION_MAX_MRP: 118,  // Максимальный вычет на обучение - 118 МРП в год
    MEDICAL_MAX_MRP: 118,    // Максимальный вычет на мед. услуги - 118 МРП в год
    MORTGAGE_MAX_MRP: 118,   // Максимальный вычет на ипотеку - 118 МРП в год
  },
  
  // Лимит для применения 90% корректировки ИПН
  IPN_90_PERCENT_LIMIT_MRP: 25, // Доход менее 25 МРП уменьшается на 90%
} as const

// Типы категорий сотрудников
export type EmployeeCategory = 
  | 'standard'           // Обычный сотрудник
  | 'pensioner_age'      // Пенсионер по возрасту
  | 'pensioner_service'  // Пенсионер за выслугу лет
  | 'disabled_1_2'       // Инвалид I, II группы (бессрочно)
  | 'disabled_2_temp'    // Инвалид II группы (справка до 2027 г.)
  | 'disabled_3'         // Инвалид III группы
  | 'parent_disabled_child' // Родитель ребенка с инвалидностью
  | 'foreigner_resident' // Иностранец с ВНЖ
  | 'foreigner_eaeu_permanent' // Иностранец из ЕАЭС, постоянно пребывающий
  | 'foreigner_eaeu_temporary' // Иностранец из ЕАЭС, временно пребывающий
  | 'foreigner_remote'   // Иностранец, работающий дистанционно
  | 'foreigner_third_permanent' // Иностранец из третьих стран, постоянно пребывающий
  | 'foreigner_third_temporary' // Иностранец из третьих стран, временно пребывающий
  | 'harmful_work'       // Работник с вредными условиями труда

// Типы дополнительных вычетов
export type AdditionalDeduction = 
  | 'opv'              // Вычет по ОПВ
  | 'vosms'            // Вычет по ВОСМС
  | 'standard_mrp'     // Стандартный вычет 14 МРП
  | 'disability'       // Вычет для инвалидов
  | 'chernobyl'        // Вычет для чернобыльцев/афганцев
  | 'child_disability' // Вычет для родителей детей с инвалидностью
  | 'multichild'       // Вычет для многодетных семей
  | 'education'        // Вычет на обучение
  | 'medical'          // Вычет на мед. услуги
  | 'mortgage'         // Вычет на ипотеку
  | 'dpv'              // Вычет по добровольным пенсионным взносам

// Интерфейс для данных сотрудника
export interface EmployeePayrollData {
  id?: number
  name: string
  salary: number
  category: EmployeeCategory
  additionalDeductions: AdditionalDeduction[]
  harmfulWork?: boolean
  // Дополнительные данные для расчета
  educationExpenses?: number
  medicalExpenses?: number
  mortgagePayments?: number
  dpvAmount?: number
}

// Интерфейс для результата расчета
export interface PayrollCalculation {
  // Доходы
  grossSalary: number
  
  // Удержания с сотрудника
  employeeDeductions: {
    opv: number
    vosms: number
    ipn: number
  }
  
  // Отчисления работодателя
  employerContributions: {
    oosms: number
    so: number
    sn: number
    oppv: number
    opvr: number
  }
  
  // Итоговые суммы
  totalEmployeeDeductions: number
  totalEmployerContributions: number
  netSalary: number
  
  // Детализация расчета ИПН
  ipnCalculation: {
    taxableIncome: number
    appliedDeductions: number
    incomeAfterDeductions: number
    ninetyPercentAdjustment: number
    finalTaxableIncome: number
    ipnAmount: number
  }
  
  // Детализация налоговых вычетов
  taxDeductions: {
    standardMrp: number
    opvDeduction: number
    vosmsDeduction: number
    additionalDeductions: number
    totalDeductions: number
  }
}

/**
 * Основная функция расчета заработной платы
 */
export function calculatePayroll(employee: EmployeePayrollData): PayrollCalculation {
  const { salary, category, additionalDeductions, harmfulWork } = employee
  
  // 1. Расчет обязательных пенсионных взносов (ОПВ)
  const opv = calculateOPV(salary, category)
  
  // 2. Расчет взносов на обязательное соц. мед. страхование (ВОСМС)
  const vosms = calculateVOSMS(salary, category)
  
  // 3. Расчет налоговых вычетов
  const taxDeductions = calculateTaxDeductions(salary, opv, vosms, additionalDeductions, employee)
  
  // 4. Расчет подоходного налога (ИПН)
  const ipnCalculation = calculateIPN(salary, opv, vosms, taxDeductions)
  
  // 5. Расчет социальных отчислений (СО)
  const so = calculateSO(salary, opv, category)
  
  // 6. Расчет социального налога (СН)
  const sn = calculateSN(salary, opv, vosms, so, category)
  
  // 7. Расчет отчислений на обязательное соц. мед. страхование (ООСМС)
  const oosms = calculateOOSMS(salary, category)
  
  // 8. Расчет профессиональных пенсионных взносов (ОППВ)
  const oppv = calculateOPPV(salary, harmfulWork || false, category)
  
  // 9. Расчет обязательных пенсионных взносов работодателя (ОПВР)
  const opvr = calculateOPVR(salary, category)
  
  // Итоговые расчеты
  const totalEmployeeDeductions = opv + vosms + ipnCalculation.ipnAmount
  const totalEmployerContributions = oosms + so + sn + oppv + opvr
  const netSalary = salary - totalEmployeeDeductions
  
  return {
    grossSalary: salary,
    employeeDeductions: {
      opv,
      vosms,
      ipn: ipnCalculation.ipnAmount,
    },
    employerContributions: {
      oosms,
      so,
      sn,
      oppv,
      opvr,
    },
    totalEmployeeDeductions,
    totalEmployerContributions,
    netSalary,
    ipnCalculation,
    taxDeductions,
  }
}

/**
 * Расчет обязательных пенсионных взносов (ОПВ)
 */
function calculateOPV(salary: number, category: EmployeeCategory): number {
  // Пенсионеры не платят ОПВ
  if (category === 'pensioner_age' || category === 'pensioner_service') {
    return 0
  }
  
  // Инвалиды I, II группы не платят ОПВ
  if (category === 'disabled_1_2') {
    return 0
  }
  
  const maxOPV = PAYROLL_CONSTANTS_2025.MZP * PAYROLL_CONSTANTS_2025.LIMITS.OPV_MAX
  const opvAmount = salary * PAYROLL_CONSTANTS_2025.RATES.OPV
  
  return Math.min(opvAmount, maxOPV)
}

/**
 * Расчет взносов на обязательное соц. мед. страхование (ВОСМС)
 */
function calculateVOSMS(salary: number, category: EmployeeCategory): number {
  // Некоторые категории не платят ВОСМС
  if (category === 'foreigner_remote' || 
      category === 'foreigner_third_permanent' || 
      category === 'foreigner_third_temporary') {
    return 0
  }
  
  const maxVOSMS = PAYROLL_CONSTANTS_2025.MZP * PAYROLL_CONSTANTS_2025.LIMITS.VOSMS_MAX
  const vosmsAmount = salary * PAYROLL_CONSTANTS_2025.RATES.VOSMS
  
  return Math.min(vosmsAmount, maxVOSMS)
}

/**
 * Расчет налоговых вычетов
 */
function calculateTaxDeductions(
  salary: number, 
  opv: number, 
  vosms: number, 
  additionalDeductions: AdditionalDeduction[],
  employee: EmployeePayrollData
): { standardMrp: number; opvDeduction: number; vosmsDeduction: number; additionalDeductions: number; totalDeductions: number } {
  const standardMrp = PAYROLL_CONSTANTS_2025.MRP * PAYROLL_CONSTANTS_2025.DEDUCTIONS.STANDARD_MRP
  const opvDeduction = opv
  const vosmsDeduction = vosms
  
  let additionalDeductionsAmount = 0
  
  // Расчет дополнительных вычетов
  for (const deduction of additionalDeductions) {
    switch (deduction) {
      case 'disability':
        if (employee.category === 'disabled_1_2' || employee.category === 'disabled_3' || employee.category === 'disabled_2_temp') {
          additionalDeductionsAmount += PAYROLL_CONSTANTS_2025.MRP * PAYROLL_CONSTANTS_2025.DEDUCTIONS.DISABILITY_MRP / 12
        }
        break
      case 'chernobyl':
        additionalDeductionsAmount += PAYROLL_CONSTANTS_2025.MRP * PAYROLL_CONSTANTS_2025.DEDUCTIONS.CHERNOBYL_MRP / 12
        break
      case 'child_disability':
        additionalDeductionsAmount += PAYROLL_CONSTANTS_2025.MRP * PAYROLL_CONSTANTS_2025.DEDUCTIONS.CHILD_DISABILITY_MRP / 12
        break
      case 'multichild':
        additionalDeductionsAmount += PAYROLL_CONSTANTS_2025.MRP * PAYROLL_CONSTANTS_2025.DEDUCTIONS.MULTICHILD_MRP / 12
        break
      case 'education':
        if (employee.educationExpenses) {
          const maxEducationDeduction = PAYROLL_CONSTANTS_2025.MRP * PAYROLL_CONSTANTS_2025.DEDUCTIONS.EDUCATION_MAX_MRP / 12
          additionalDeductionsAmount += Math.min(employee.educationExpenses, maxEducationDeduction)
        }
        break
      case 'medical':
        if (employee.medicalExpenses) {
          const maxMedicalDeduction = PAYROLL_CONSTANTS_2025.MRP * PAYROLL_CONSTANTS_2025.DEDUCTIONS.MEDICAL_MAX_MRP / 12
          additionalDeductionsAmount += Math.min(employee.medicalExpenses, maxMedicalDeduction)
        }
        break
      case 'mortgage':
        if (employee.mortgagePayments) {
          const maxMortgageDeduction = PAYROLL_CONSTANTS_2025.MRP * PAYROLL_CONSTANTS_2025.DEDUCTIONS.MORTGAGE_MAX_MRP / 12
          additionalDeductionsAmount += Math.min(employee.mortgagePayments, maxMortgageDeduction)
        }
        break
      case 'dpv':
        if (employee.dpvAmount) {
          additionalDeductionsAmount += employee.dpvAmount
        }
        break
    }
  }
  
  const totalDeductions = standardMrp + opvDeduction + vosmsDeduction + additionalDeductionsAmount
  
  return {
    standardMrp,
    opvDeduction,
    vosmsDeduction,
    additionalDeductions: additionalDeductionsAmount,
    totalDeductions,
  }
}

/**
 * Расчет подоходного налога (ИПН)
 */
function calculateIPN(
  salary: number, 
  opv: number, 
  vosms: number, 
  taxDeductions: { totalDeductions: number }
): { taxableIncome: number; appliedDeductions: number; incomeAfterDeductions: number; ninetyPercentAdjustment: number; finalTaxableIncome: number; ipnAmount: number } {
  const taxableIncome = salary
  const appliedDeductions = taxDeductions.totalDeductions
  const incomeAfterDeductions = taxableIncome - appliedDeductions
  
  // Проверка на применение 90% корректировки
  const limitFor90Percent = PAYROLL_CONSTANTS_2025.MRP * PAYROLL_CONSTANTS_2025.IPN_90_PERCENT_LIMIT_MRP
  let ninetyPercentAdjustment = 0
  let finalTaxableIncome = incomeAfterDeductions
  
  if (incomeAfterDeductions < limitFor90Percent) {
    ninetyPercentAdjustment = incomeAfterDeductions * 0.9
    finalTaxableIncome = incomeAfterDeductions - ninetyPercentAdjustment
  }
  
  const ipnAmount = finalTaxableIncome * PAYROLL_CONSTANTS_2025.RATES.IPN
  
  return {
    taxableIncome,
    appliedDeductions,
    incomeAfterDeductions,
    ninetyPercentAdjustment,
    finalTaxableIncome,
    ipnAmount: Math.round(ipnAmount),
  }
}

/**
 * Расчет социальных отчислений (СО)
 */
function calculateSO(salary: number, opv: number, category: EmployeeCategory): number {
  // Некоторые категории не платят СО
  if (category === 'foreigner_remote' || 
      category === 'foreigner_third_permanent' || 
      category === 'foreigner_third_temporary') {
    return 0
  }
  
  const adjustedSalary = salary - opv
  const minSO = PAYROLL_CONSTANTS_2025.MZP * PAYROLL_CONSTANTS_2025.LIMITS.SO_MIN
  const maxSO = PAYROLL_CONSTANTS_2025.MZP * PAYROLL_CONSTANTS_2025.LIMITS.SO_MAX
  
  const soAmount = adjustedSalary * PAYROLL_CONSTANTS_2025.RATES.SO
  
  // СО рассчитывается от скорректированного дохода, но не менее 1 МЗП и не более 7 МЗП
  if (adjustedSalary < minSO) {
    return minSO * PAYROLL_CONSTANTS_2025.RATES.SO
  } else if (adjustedSalary > maxSO) {
    return maxSO * PAYROLL_CONSTANTS_2025.RATES.SO
  }
  
  return soAmount
}

/**
 * Расчет социального налога (СН)
 */
function calculateSN(salary: number, opv: number, vosms: number, so: number, category: EmployeeCategory): number {
  // Некоторые категории не платят СН
  if (category === 'foreigner_remote' || 
      category === 'foreigner_third_permanent' || 
      category === 'foreigner_third_temporary') {
    return salary * PAYROLL_CONSTANTS_2025.RATES.SN
  }
  
  const adjustedSalary = salary - opv - vosms
  const snAmount = adjustedSalary * PAYROLL_CONSTANTS_2025.RATES.SN
  
  // СН уменьшается на сумму СО
  return Math.max(snAmount - so, 0)
}

/**
 * Расчет отчислений на обязательное соц. мед. страхование (ООСМС)
 */
function calculateOOSMS(salary: number, category: EmployeeCategory): number {
  // Некоторые категории не платят ООСМС
  if (category === 'foreigner_remote' || 
      category === 'foreigner_third_permanent' || 
      category === 'foreigner_third_temporary') {
    return 0
  }
  
  const maxOOSMS = PAYROLL_CONSTANTS_2025.MZP * PAYROLL_CONSTANTS_2025.LIMITS.OOSMS_MAX
  const oosmsAmount = salary * PAYROLL_CONSTANTS_2025.RATES.OOSMS
  
  return Math.min(oosmsAmount, maxOOSMS)
}

/**
 * Расчет профессиональных пенсионных взносов (ОППВ)
 */
function calculateOPPV(salary: number, harmfulWork: boolean, category: EmployeeCategory): number {
  // ОППВ уплачиваются только за сотрудников с вредными условиями труда
  if (!harmfulWork) {
    return 0
  }
  
  return salary * PAYROLL_CONSTANTS_2025.RATES.OPPV
}

/**
 * Расчет обязательных пенсионных взносов работодателя (ОПВР)
 */
function calculateOPVR(salary: number, category: EmployeeCategory): number {
  // Некоторые категории не платят ОПВР
  if (category === 'foreigner_remote' || 
      category === 'foreigner_third_permanent' || 
      category === 'foreigner_third_temporary') {
    return 0
  }
  
  const minOPVR = PAYROLL_CONSTANTS_2025.MZP * PAYROLL_CONSTANTS_2025.LIMITS.OPVR_MIN
  const maxOPVR = PAYROLL_CONSTANTS_2025.MZP * PAYROLL_CONSTANTS_2025.LIMITS.OPVR_MAX
  
  const opvrAmount = salary * PAYROLL_CONSTANTS_2025.RATES.OPVR
  
  // ОПВР рассчитывается от дохода, но не менее 1 МЗП и не более 50 МЗП
  if (salary < minOPVR) {
    return minOPVR * PAYROLL_CONSTANTS_2025.RATES.OPVR
  } else if (salary > maxOPVR) {
    return maxOPVR * PAYROLL_CONSTANTS_2025.RATES.OPVR
  }
  
  return opvrAmount
}

/**
 * Форматирование суммы в тенге
 */
export function formatCurrency(amount: number): string {
  return `₸ ${Math.round(amount).toLocaleString('ru-RU')}`
}

/**
 * Получение названия категории сотрудника
 */
export function getEmployeeCategoryLabel(category: EmployeeCategory): string {
  const labels: Record<EmployeeCategory, string> = {
    standard: 'Обычный сотрудник',
    pensioner_age: 'Пенсионер по возрасту',
    pensioner_service: 'Пенсионер за выслугу лет',
    disabled_1_2: 'Инвалид I, II группы (бессрочно)',
    disabled_2_temp: 'Инвалид II группы (справка до 2027 г.)',
    disabled_3: 'Инвалид III группы',
    parent_disabled_child: 'Родитель ребенка с инвалидностью',
    foreigner_resident: 'Иностранец с ВНЖ',
    foreigner_eaeu_permanent: 'Иностранец из ЕАЭС, постоянно пребывающий',
    foreigner_eaeu_temporary: 'Иностранец из ЕАЭС, временно пребывающий',
    foreigner_remote: 'Иностранец, работающий дистанционно',
    foreigner_third_permanent: 'Иностранец из третьих стран, постоянно пребывающий',
    foreigner_third_temporary: 'Иностранец из третьих стран, временно пребывающий',
    harmful_work: 'Работник с вредными условиями труда',
  }
  
  return labels[category] || 'Неизвестная категория'
}

/**
 * Получение названия дополнительного вычета
 */
export function getAdditionalDeductionLabel(deduction: AdditionalDeduction): string {
  const labels: Record<AdditionalDeduction, string> = {
    opv: 'Вычет по ОПВ',
    vosms: 'Вычет по ВОСМС',
    standard_mrp: 'Стандартный вычет 14 МРП',
    disability: 'Вычет для инвалидов',
    chernobyl: 'Вычет для чернобыльцев/афганцев',
    child_disability: 'Вычет для родителей детей с инвалидностью',
    multichild: 'Вычет для многодетных семей',
    education: 'Вычет на обучение',
    medical: 'Вычет на мед. услуги',
    mortgage: 'Вычет на ипотеку',
    dpv: 'Вычет по добровольным пенсионным взносам',
  }
  
  return labels[deduction] || 'Неизвестный вычет'
}
