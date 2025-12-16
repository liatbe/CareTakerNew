import { format, startOfMonth, endOfMonth, parseISO, addMonths, subMonths, getYear, getMonth, isSameDay, isWithinInterval } from 'date-fns'

export const formatDate = (date, formatStr = 'yyyy-MM-dd') => {
  if (!date) return ''
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, formatStr)
}

export const getMonthKey = (date) => {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'yyyy-MM')
}

export const getCurrentMonthKey = () => {
  return getMonthKey(new Date())
}

export const getMonthStart = (date) => {
  const d = typeof date === 'string' ? parseISO(date) : date
  return startOfMonth(d)
}

export const getMonthEnd = (date) => {
  const d = typeof date === 'string' ? parseISO(date) : date
  return endOfMonth(d)
}

export const addMonth = (date, months = 1) => {
  const d = typeof date === 'string' ? parseISO(date) : date
  return addMonths(d, months)
}

export const subMonth = (date, months = 1) => {
  const d = typeof date === 'string' ? parseISO(date) : date
  return subMonths(d, months)
}

export const getYearFromDate = (date) => {
  const d = typeof date === 'string' ? parseISO(date) : date
  return getYear(d)
}

export const getMonthFromDate = (date) => {
  const d = typeof date === 'string' ? parseISO(date) : date
  return getMonth(d) + 1
}

// Calculate contract year based on contract start date
// Contract year 0 = first 12 months from start date, year 1 = next 12 months, etc.
export const getContractYear = (date, contractStartDate) => {
  if (!contractStartDate) return 0
  
  const checkDate = typeof date === 'string' ? parseISO(date) : date
  const startDate = typeof contractStartDate === 'string' ? parseISO(contractStartDate) : contractStartDate
  
  if (checkDate < startDate) return -1 // Before contract start
  
  const monthsDiff = (checkDate.getFullYear() - startDate.getFullYear()) * 12 + 
                     (checkDate.getMonth() - startDate.getMonth())
  
  return Math.floor(monthsDiff / 12)
}

// Get contract year key for storage (year_0, year_1, etc.)
export const getContractYearKey = (date, contractStartDate) => {
  const year = getContractYear(date, contractStartDate)
  return `year_${year}`
}

// Get all contract years from start to current (and optionally future)
export const getContractYears = (contractStartDate, includeFuture = true) => {
  if (!contractStartDate) return []
  
  const startDate = typeof contractStartDate === 'string' ? parseISO(contractStartDate) : contractStartDate
  const currentDate = new Date()
  const currentYear = getContractYear(currentDate, contractStartDate)
  
  const years = []
  // Include past years (up to 5 years back)
  const startYear = Math.max(0, currentYear - 5)
  const endYear = includeFuture ? currentYear + 2 : currentYear
  
  for (let i = startYear; i <= endYear; i++) {
    const yearStart = addMonths(startDate, i * 12)
    const yearEnd = addMonths(startDate, (i + 1) * 12)
    years.push({
      year: i,
      key: `year_${i}`,
      startDate: yearStart,
      endDate: yearEnd,
      label: i === 0 ? 'Year 1' : `Year ${i + 1}`
    })
  }
  
  return years
}

export { isSameDay, isWithinInterval, parseISO }

