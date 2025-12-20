import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import MonthSelector from '../components/MonthSelector'
import { storage } from '../utils/storage'
import { getMonthKey, getYearFromDate, getContractYear, getContractYearKey, getContractYears, formatDate, parseISO } from '../utils/dateUtils'
import { format } from 'date-fns'
import { exportToExcel } from '../utils/excelExport'
import { isAdmin } from '../utils/auth'
import './CaretakerPayslips.css'

const CaretakerPayslips = () => {
  const isReadOnly = !isAdmin() // Read-only for caretakers
  const userIsAdmin = isAdmin() // Check if user is admin for conditional display
  const { t } = useTranslation()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [contractStartDate, setContractStartDate] = useState('')
  const [monthlyBaseAmount, setMonthlyBaseAmount] = useState(6250)
  const [yearlyBaseAmounts, setYearlyBaseAmounts] = useState({})
  const [editingYear, setEditingYear] = useState(null)
  const [paymentStatus, setPaymentStatus] = useState('pending')
  const [selectedContractYear, setSelectedContractYear] = useState(0)
  const [monthlyPaidAmount, setMonthlyPaidAmount] = useState(0)
  const [monthlyPaymentPaidAmounts, setMonthlyPaymentPaidAmounts] = useState({})
  const [yearlyPaymentPaidAmounts, setYearlyPaymentPaidAmounts] = useState({})

  const currentMonthKey = getMonthKey(selectedDate)
  const currentYear = getYearFromDate(selectedDate)
  const currentContractYear = contractStartDate ? getContractYear(selectedDate, contractStartDate) : 0

  useEffect(() => {
    loadData()
    // Set selected contract year to current contract year
    if (contractStartDate) {
      const contractYear = getContractYear(selectedDate, contractStartDate)
      setSelectedContractYear(contractYear)
    }
  }, [currentMonthKey, contractStartDate, selectedDate])

  const loadData = () => {
    const startDate = storage.get('contractStartDate')
    if (startDate) setContractStartDate(startDate)
    
    const baseAmount = storage.get('monthlyBaseAmount', 6250)
    setMonthlyBaseAmount(baseAmount)
    
    const yearlyAmounts = storage.get('yearlyBaseAmounts', {})
    setYearlyBaseAmounts(yearlyAmounts)
    
    const payslips = storage.get('payslips', {})
    const currentPayslip = payslips[currentMonthKey]
    if (currentPayslip) {
      setPaymentStatus(currentPayslip.paymentStatus || 'pending')
      setMonthlyPaidAmount(currentPayslip.monthlyPaidAmount || 0)
      setMonthlyPaymentPaidAmounts(currentPayslip.monthlyPaymentPaidAmounts || {})
      
      // Load yearly payment paid amounts for selected contract year
      if (contractStartDate) {
        const yearKey = `year_${selectedContractYear}`
        const yearlyPaidAmounts = currentPayslip.yearlyPaymentPaidAmounts || {}
        setYearlyPaymentPaidAmounts(yearlyPaidAmounts[yearKey] || {})
      } else {
        setYearlyPaymentPaidAmounts({})
      }
    } else {
      setPaymentStatus('pending')
      setMonthlyPaidAmount(0)
      setMonthlyPaymentPaidAmounts({})
      setYearlyPaymentPaidAmounts({})
    }
  }

  const savePayslip = (data) => {
    const payslips = storage.get('payslips', {})
    payslips[currentMonthKey] = data
    storage.set('payslips', payslips)
  }

  const handleYearlyBaseAmountChange = (year, amount) => {
    const updated = { ...yearlyBaseAmounts, [year]: parseFloat(amount) || 6250 }
    setYearlyBaseAmounts(updated)
    storage.set('yearlyBaseAmounts', updated)
    
    // Update monthly base amount if it's the current year
    if (parseInt(year) === currentYear) {
      setMonthlyBaseAmount(parseFloat(amount) || 6250)
      storage.set('monthlyBaseAmount', parseFloat(amount) || 6250)
    }
  }

  // Get Shevah total for current month
  const getShevahTotal = () => {
    const shevahData = storage.get('shevahCoverage', {})
    const monthShevah = shevahData[currentMonthKey] || []
    return monthShevah.reduce((sum, r) => sum + (r.hours * r.amountPerHour), 0)
  }

  // Check if there are any Shevah entries for current month
  const hasShevahEntries = () => {
    const shevahData = storage.get('shevahCoverage', {})
    const monthShevah = shevahData[currentMonthKey] || []
    return monthShevah.length > 0
  }

  // Get monthly one-time payments from worklog
  const getMonthlyOneTimePayments = () => {
    const worklog = storage.get('worklog', {})
    const monthWorklog = worklog[currentMonthKey] || []
    const activityCharges = storage.get('activityCharges', {})
    const payslips = storage.get('payslips', {})
    const currentPayslip = payslips[currentMonthKey] || {}
    const monthlyPaymentStatuses = currentPayslip.monthlyPaymentStatuses || {}
    const monthlyPaymentPaidAmounts = currentPayslip.monthlyPaymentPaidAmounts || {}
    
    const payments = []
    monthWorklog.forEach(activity => {
      if (activity.type === 'shabbat' || activity.type === 'pocketMoney') {
        const charge = activityCharges[activity.type] || 0
        if (charge > 0) {
          const paymentId = `${activity.type}_${activity.date}`
          payments.push({
            id: paymentId,
            type: activity.type,
            date: activity.date,
            amount: charge,
            description: t(`caretakerWorklog.${activity.type}`),
            paymentStatus: monthlyPaymentStatuses[paymentId] || 'pending',
            paidAmount: monthlyPaymentPaidAmounts[paymentId] || 0
          })
        }
      }
    })
    
    return payments
  }

  // Get yearly one-time payments for selected contract year
  const getYearlyPayments = () => {
    if (!contractStartDate) {
      return []
    }
    
    const contractYearKey = getContractYearKey(selectedDate, contractStartDate)
    const yearKey = `year_${selectedContractYear}`
    
    // Get yearly payments for this contract year (excluding bituahLeumi)
    const yearlyPaymentsData = storage.get('yearlyPayments', {})
    let yearPayments = yearlyPaymentsData[yearKey] || {
      medicalInsurance: 0,
      taagidPayment: 2000,
      taagidHandling: 840,
      havraaAmountPerDay: 174,
      havraaDays: 5
    }
    
    // Ensure Havraa fields exist (for backward compatibility and year 1 initialization)
    if (!yearPayments.havraaAmountPerDay) {
      yearPayments.havraaAmountPerDay = 174
    }
    if (!yearPayments.havraaDays) {
      yearPayments.havraaDays = 5
    }
    
    // Save back if we added defaults (especially for year_0)
    if (!yearlyPaymentsData[yearKey]) {
      yearlyPaymentsData[yearKey] = yearPayments
      storage.set('yearlyPayments', yearlyPaymentsData)
    } else if (!yearlyPaymentsData[yearKey].havraaAmountPerDay || !yearlyPaymentsData[yearKey].havraaDays) {
      yearlyPaymentsData[yearKey] = yearPayments
      storage.set('yearlyPayments', yearlyPaymentsData)
    }
    
    // Remove bituahLeumi if it exists (for backward compatibility)
    const { bituahLeumi, havraaAmountPerDay, havraaDays, ...otherPayments } = yearPayments
    
    const payslips = storage.get('payslips', {})
    const currentPayslip = payslips[currentMonthKey] || {}
    const yearlyPaymentStatuses = currentPayslip.yearlyPaymentStatuses || {}
    const yearStatuses = yearlyPaymentStatuses[yearKey] || {}
    
    const payments = []
    
    // Add Havraa as a special yearly payment (amount × days)
    if (havraaAmountPerDay && havraaDays) {
      const havraaTotal = havraaAmountPerDay * havraaDays
      payments.push({
        key: 'havraa',
        amount: havraaTotal,
        paymentStatus: yearStatuses.havraa || 'pending',
        amountPerDay: havraaAmountPerDay,
        days: havraaDays
      })
    }
    
    // Add other yearly payments
    Object.entries(otherPayments).forEach(([key, value]) => {
      payments.push({
        key,
        amount: value,
        paymentStatus: yearStatuses[key] || 'pending'
      })
    })
    
    return payments
  }

  const handlePaymentStatusChange = (status) => {
    setPaymentStatus(status)
    const payslips = storage.get('payslips', {})
    if (!payslips[currentMonthKey]) {
      payslips[currentMonthKey] = {}
    }
    payslips[currentMonthKey].paymentStatus = status
    // Clear paid amount if status is not partial
    if (status !== 'partial') {
      payslips[currentMonthKey].monthlyPaidAmount = 0
      setMonthlyPaidAmount(0)
    }
    storage.set('payslips', payslips)
  }

  const handleMonthlyPaidAmountChange = (amount) => {
    const paidAmount = parseFloat(amount) || 0
    setMonthlyPaidAmount(paidAmount)
    const payslips = storage.get('payslips', {})
    if (!payslips[currentMonthKey]) {
      payslips[currentMonthKey] = {}
    }
    payslips[currentMonthKey].monthlyPaidAmount = paidAmount
    storage.set('payslips', payslips)
  }

  const handleMonthlyPaymentStatusChange = (paymentId, status) => {
    const payslips = storage.get('payslips', {})
    if (!payslips[currentMonthKey]) {
      payslips[currentMonthKey] = {}
    }
    if (!payslips[currentMonthKey].monthlyPaymentStatuses) {
      payslips[currentMonthKey].monthlyPaymentStatuses = {}
    }
    if (!payslips[currentMonthKey].monthlyPaymentPaidAmounts) {
      payslips[currentMonthKey].monthlyPaymentPaidAmounts = {}
    }
    payslips[currentMonthKey].monthlyPaymentStatuses[paymentId] = status
    // Clear paid amount if status is not partial
    if (status !== 'partial') {
      payslips[currentMonthKey].monthlyPaymentPaidAmounts[paymentId] = 0
      const updated = { ...monthlyPaymentPaidAmounts }
      delete updated[paymentId]
      setMonthlyPaymentPaidAmounts(updated)
    }
    storage.set('payslips', payslips)
    loadData() // Reload to update UI
  }

  const handleMonthlyPaymentPaidAmountChange = (paymentId, amount) => {
    const paidAmount = parseFloat(amount) || 0
    const updated = { ...monthlyPaymentPaidAmounts, [paymentId]: paidAmount }
    setMonthlyPaymentPaidAmounts(updated)
    const payslips = storage.get('payslips', {})
    if (!payslips[currentMonthKey]) {
      payslips[currentMonthKey] = {}
    }
    if (!payslips[currentMonthKey].monthlyPaymentPaidAmounts) {
      payslips[currentMonthKey].monthlyPaymentPaidAmounts = {}
    }
    payslips[currentMonthKey].monthlyPaymentPaidAmounts[paymentId] = paidAmount
    storage.set('payslips', payslips)
  }

  const handleYearlyPaymentStatusChange = (paymentKey, status) => {
    if (!contractStartDate) return
    
    const yearKey = `year_${selectedContractYear}`
    const payslips = storage.get('payslips', {})
    if (!payslips[currentMonthKey]) {
      payslips[currentMonthKey] = {}
    }
    if (!payslips[currentMonthKey].yearlyPaymentStatuses) {
      payslips[currentMonthKey].yearlyPaymentStatuses = {}
    }
    if (!payslips[currentMonthKey].yearlyPaymentStatuses[yearKey]) {
      payslips[currentMonthKey].yearlyPaymentStatuses[yearKey] = {}
    }
    if (!payslips[currentMonthKey].yearlyPaymentPaidAmounts) {
      payslips[currentMonthKey].yearlyPaymentPaidAmounts = {}
    }
    if (!payslips[currentMonthKey].yearlyPaymentPaidAmounts[yearKey]) {
      payslips[currentMonthKey].yearlyPaymentPaidAmounts[yearKey] = {}
    }
    payslips[currentMonthKey].yearlyPaymentStatuses[yearKey][paymentKey] = status
    // Clear paid amount if status is not partial
    if (status !== 'partial') {
      payslips[currentMonthKey].yearlyPaymentPaidAmounts[yearKey][paymentKey] = 0
      const updated = { ...yearlyPaymentPaidAmounts }
      delete updated[paymentKey]
      setYearlyPaymentPaidAmounts(updated)
    }
    storage.set('payslips', payslips)
    loadData() // Reload to update UI
  }

  const handleYearlyPaymentPaidAmountChange = (paymentKey, amount) => {
    const paidAmount = parseFloat(amount) || 0
    const yearKey = `year_${selectedContractYear}`
    const updated = { ...yearlyPaymentPaidAmounts, [paymentKey]: paidAmount }
    setYearlyPaymentPaidAmounts(updated)
    const payslips = storage.get('payslips', {})
    if (!payslips[currentMonthKey]) {
      payslips[currentMonthKey] = {}
    }
    if (!payslips[currentMonthKey].yearlyPaymentPaidAmounts) {
      payslips[currentMonthKey].yearlyPaymentPaidAmounts = {}
    }
    if (!payslips[currentMonthKey].yearlyPaymentPaidAmounts[yearKey]) {
      payslips[currentMonthKey].yearlyPaymentPaidAmounts[yearKey] = {}
    }
    payslips[currentMonthKey].yearlyPaymentPaidAmounts[yearKey][paymentKey] = paidAmount
    storage.set('payslips', payslips)
  }

  const handleExport = () => {
    const allPayslips = storage.get('payslips', {})
    const shevahData = storage.get('shevahCoverage', {})
    const worklog = storage.get('worklog', {})
    const activityCharges = storage.get('activityCharges', {})
    const yearlyPaymentsData = storage.get('yearlyPayments', {})
    
    // Get all month keys and sort them chronologically
    const monthKeys = Object.keys(allPayslips).sort()
    const exportRows = []
    
    // Helper function to get payslip data for a specific month
    const getPayslipDataForMonth = (monthKey) => {
      const monthDate = parseISO(`${monthKey}-01`)
      const monthYear = getYearFromDate(monthDate)
      const monthBaseAmount = yearlyBaseAmounts[monthYear] || monthlyBaseAmount
      
      // Get Shevah total for this month
      const monthShevah = shevahData[monthKey] || []
      const shevahTotal = monthShevah.reduce((sum, r) => sum + (r.hours * r.amountPerHour), 0)
      
      const remainingBase = monthBaseAmount - shevahTotal
      const pension = remainingBase * 0.065
      const firingPayment = remainingBase * 0.0833
      const bituahLeumi = remainingBase * 0.036
      
      // Get monthly one-time payments for this month
      const monthWorklog = worklog[monthKey] || []
      const payslip = allPayslips[monthKey] || {}
      const monthlyPaymentStatuses = payslip.monthlyPaymentStatuses || {}
      const monthlyPaymentPaidAmounts = payslip.monthlyPaymentPaidAmounts || {}
      
      const monthlyOneTime = []
      monthWorklog.forEach(activity => {
        if (activity.type === 'shabbat' || activity.type === 'pocketMoney') {
          const charge = activityCharges[activity.type] || 0
          if (charge > 0) {
            const paymentId = `${activity.type}_${activity.date}`
            monthlyOneTime.push({
              id: paymentId,
              type: activity.type,
              date: activity.date,
              amount: charge,
              description: t(`caretakerWorklog.${activity.type}`),
              paymentStatus: monthlyPaymentStatuses[paymentId] || 'pending',
              paidAmount: monthlyPaymentPaidAmounts[paymentId] || 0
            })
          }
        }
      })
      
      return {
        monthKey,
        monthDate,
        monthBaseAmount,
        shevahTotal,
        remainingBase,
        pension,
        firingPayment,
        bituahLeumi,
        monthlyOneTime,
        paymentStatus: payslip.paymentStatus || 'pending',
        monthlyPaidAmount: payslip.monthlyPaidAmount || 0
      }
    }
    
    // Create rows for all months
    monthKeys.forEach(monthKey => {
      const payslipData = getPayslipDataForMonth(monthKey)
      const monthLabel = format(payslipData.monthDate, 'MMMM yyyy')
      
      // Build main row with all monthly data
      const mainRow = {
        [t('caretakerPayslips.month', 'Month')]: monthLabel,
        [t('caretakerPayslips.contractStartDate')]: contractStartDate,
        [t('caretakerPayslips.monthlyBaseAmount')]: payslipData.monthBaseAmount,
        [t('caretakerPayslips.baseAmount')]: payslipData.monthBaseAmount,
        [t('caretakerPayslips.paidByShevah')]: payslipData.shevahTotal,
        [t('caretakerPayslips.remainingBaseAmount')]: payslipData.remainingBase,
        [t('caretakerPayslips.pension')]: payslipData.pension,
        [t('caretakerPayslips.firingPayment')]: payslipData.firingPayment,
        [t('caretakerPayslips.bituahLeumi')]: payslipData.bituahLeumi,
        [t('caretakerPayslips.paymentStatus')]: payslipData.paymentStatus,
        [t('caretakerPayslips.monthlyOneTimePayments')]: '', // Empty for main row
        [t('common.description')]: '', // Empty for main row
        [t('common.amount')]: '', // Empty for main row
        [t('caretakerPayslips.paymentStatus') + ' (One-Time)']: '' // Empty for main row
      }
      
      exportRows.push(mainRow)
      
      // Add subrows for each monthly one-time payment
      payslipData.monthlyOneTime.forEach((payment) => {
        const subRow = {
          [t('caretakerPayslips.month', 'Month')]: `  → ${payment.description}`, // Indented to show it's a subrow
          [t('caretakerPayslips.contractStartDate')]: '',
          [t('caretakerPayslips.monthlyBaseAmount')]: '',
          [t('caretakerPayslips.baseAmount')]: '',
          [t('caretakerPayslips.paidByShevah')]: '',
          [t('caretakerPayslips.remainingBaseAmount')]: '',
          [t('caretakerPayslips.pension')]: '',
          [t('caretakerPayslips.firingPayment')]: '',
          [t('caretakerPayslips.bituahLeumi')]: '',
          [t('caretakerPayslips.paymentStatus')]: '',
          [t('caretakerPayslips.monthlyOneTimePayments')]: payment.description || '',
          [t('common.description')]: payment.description || '',
          [t('common.amount')]: payment.amount || 0,
          [t('caretakerPayslips.paymentStatus') + ' (One-Time)']: payment.paymentStatus || 'pending'
        }
        
        exportRows.push(subRow)
      })
    })
    
    // Add yearly payments as separate rows
    if (contractStartDate) {
      const contractYears = getContractYears(contractStartDate, true)
      contractYears.forEach(contractYear => {
        const yearKey = contractYear.key
        const yearPayments = yearlyPaymentsData[yearKey] || {
          medicalInsurance: 0,
          taagidPayment: 2000,
          taagidHandling: 840,
          havraaAmountPerDay: 174,
          havraaDays: 5
        }
        
        // Remove bituahLeumi if it exists
        const { bituahLeumi, havraaAmountPerDay, havraaDays, ...otherPayments } = yearPayments
        
        // Add Havraa as a yearly payment (amount × days)
        if (havraaAmountPerDay && havraaDays) {
          const havraaTotal = havraaAmountPerDay * havraaDays
          const paymentLabel = `${t('caretakerPayslips.havraa')} (${havraaAmountPerDay} × ${havraaDays} ${t('settings.days', 'days')})`
          const yearLabel = contractYear.label
          
          // Get payment status from any payslip that has it
          let paymentStatus = 'pending'
          monthKeys.forEach(monthKey => {
            const payslip = allPayslips[monthKey] || {}
            const yearlyPaymentStatuses = payslip.yearlyPaymentStatuses || {}
            const yearStatuses = yearlyPaymentStatuses[yearKey] || {}
            if (yearStatuses.havraa) {
              paymentStatus = yearStatuses.havraa
            }
          })
          
          const yearlyRow = {
            [t('caretakerPayslips.month', 'Month')]: `${yearLabel} - ${paymentLabel}`,
            [t('caretakerPayslips.contractStartDate')]: contractStartDate,
            [t('caretakerPayslips.monthlyBaseAmount')]: '',
            [t('caretakerPayslips.baseAmount')]: '',
            [t('caretakerPayslips.paidByShevah')]: '',
            [t('caretakerPayslips.remainingBaseAmount')]: '',
            [t('caretakerPayslips.pension')]: '',
            [t('caretakerPayslips.firingPayment')]: '',
            [t('caretakerPayslips.bituahLeumi')]: '',
            [t('caretakerPayslips.paymentStatus')]: paymentStatus,
            [t('caretakerPayslips.monthlyOneTimePayments')]: '',
            [t('common.description')]: paymentLabel,
            [t('common.amount')]: havraaTotal,
            [t('caretakerPayslips.paymentStatus') + ' (One-Time)']: paymentStatus
          }
          
          exportRows.push(yearlyRow)
        }
        
        // Create a row for each other yearly payment
        Object.entries(otherPayments).forEach(([key, amount]) => {
          if (amount > 0) {
            const paymentLabel = t(`caretakerPayslips.${key}`, key)
            const yearLabel = contractYear.label
            
            // Get payment status from any payslip that has it
            let paymentStatus = 'pending'
            monthKeys.forEach(monthKey => {
              const payslip = allPayslips[monthKey] || {}
              const yearlyPaymentStatuses = payslip.yearlyPaymentStatuses || {}
              const yearStatuses = yearlyPaymentStatuses[yearKey] || {}
              if (yearStatuses[key]) {
                paymentStatus = yearStatuses[key]
              }
            })
            
            const yearlyRow = {
              [t('caretakerPayslips.month', 'Month')]: `${yearLabel} - ${paymentLabel}`,
              [t('caretakerPayslips.contractStartDate')]: contractStartDate,
              [t('caretakerPayslips.monthlyBaseAmount')]: '',
              [t('caretakerPayslips.baseAmount')]: '',
              [t('caretakerPayslips.paidByShevah')]: '',
              [t('caretakerPayslips.remainingBaseAmount')]: '',
              [t('caretakerPayslips.pension')]: '',
              [t('caretakerPayslips.firingPayment')]: '',
              [t('caretakerPayslips.bituahLeumi')]: '',
              [t('caretakerPayslips.paymentStatus')]: paymentStatus,
              [t('caretakerPayslips.monthlyOneTimePayments')]: '',
              [t('common.description')]: paymentLabel,
              [t('common.amount')]: amount,
              [t('caretakerPayslips.paymentStatus') + ' (One-Time)']: paymentStatus
            }
            
            exportRows.push(yearlyRow)
          }
        })
      })
    }
    
    // Export all rows
    exportToExcel(exportRows, `caretaker-payslips-export`)
  }

  const shevahTotal = getShevahTotal()
  const baseAmount = yearlyBaseAmounts[currentYear] || monthlyBaseAmount
  const remainingBase = baseAmount - shevahTotal
  const pension = remainingBase * 0.065
  const firingPayment = remainingBase * 0.0833
  const bituahLeumi = remainingBase * 0.036
  const monthlyTotal = remainingBase + pension + firingPayment + bituahLeumi
  const monthlyOneTimePayments = getMonthlyOneTimePayments()
  const monthlyOneTimeTotal = monthlyOneTimePayments.reduce((sum, p) => sum + p.amount, 0)
  const yearlyPayments = getYearlyPayments()
  // For caretakers, only calculate total from visible payments (Medical Insurance)
  const visibleYearlyPayments = userIsAdmin 
    ? yearlyPayments 
    : yearlyPayments.filter(p => p.key === 'medicalInsurance')
  const yearlyTotal = visibleYearlyPayments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="caretaker-payslips">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('caretakerPayslips.title')}</h1>
          <p className="page-subtitle">{t('caretakerPayslips.subtitle', 'Monthly and yearly payment breakdown for the caretaker')}</p>
        </div>
        <div className="page-header-actions">
          <MonthSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
          {!isReadOnly && (
            <button className="btn btn-success" onClick={handleExport}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 9H15V3H9V9H5L12 16L19 9ZM5 18V20H19V18H5Z" fill="currentColor"/>
              </svg>
              {t('common.export')}
            </button>
          )}
        </div>
      </div>
      
      <div className="content-card card">
        <div className="contract-info" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: 'var(--spacing-xl)' }}>
          <div className="info-card">
            <div className="info-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 4H5C3.89 4 3 4.9 3 6V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4ZM19 20H5V9H19V20ZM7 11H9V13H7V11ZM11 11H13V13H11V11ZM15 11H17V13H15V11Z" fill="currentColor"/>
              </svg>
            </div>
            <div className="info-card-content">
              <div className="info-card-label">{t('caretakerPayslips.contractStartDate')}</div>
              <input
                type="date"
                value={contractStartDate}
                onChange={(e) => {
                  setContractStartDate(e.target.value)
                  storage.set('contractStartDate', e.target.value)
                }}
                disabled={isReadOnly}
                className="info-card-value"
                style={{ border: 'none', background: 'transparent', padding: 0, fontSize: '17px', fontWeight: 600 }}
              />
            </div>
          </div>
          <div className="info-card">
            <div className="info-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.8 10.9C9.53 10.31 8.8 9.7 8.8 8.75C8.8 7.66 9.81 6.9 11.5 6.9C13.28 6.9 13.94 7.75 14 9H16.21C16.14 7.28 15.09 5.7 13 5.19V3H10V5.16C8.06 5.58 6.5 6.84 6.5 8.77C6.5 11.08 8.41 12.23 11.2 12.9C13.7 13.5 14.2 14.38 14.2 15.31C14.2 16 13.71 17.1 11.5 17.1C9.28 17.1 8.63 16.18 8.5 15H6.32C6.44 17.18 7.76 18.5 10 18.93V21H13V18.91C14.97 18.5 16.5 17.35 16.5 15.3C16.5 12.46 14.07 11.5 11.8 10.9Z" fill="currentColor"/>
              </svg>
            </div>
            <div className="info-card-content">
              <div className="info-card-label">{t('caretakerPayslips.monthlyBaseAmount')} ({currentYear})</div>
              {editingYear === currentYear ? (
                <input
                  type="number"
                  value={baseAmount}
                  onChange={(e) => handleYearlyBaseAmountChange(currentYear, e.target.value)}
                  onBlur={() => setEditingYear(null)}
                  step="0.01"
                  disabled={isReadOnly}
                  className="info-card-value"
                  style={{ border: 'none', background: 'transparent', padding: 0, fontSize: '17px', fontWeight: 600 }}
                />
              ) : (
                <span 
                  className="info-card-value"
                  onClick={() => !isReadOnly && setEditingYear(currentYear)} 
                  style={{ cursor: isReadOnly ? 'default' : 'pointer', fontSize: '17px', fontWeight: 600 }}
                >
                  {baseAmount.toFixed(2)} ₪
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="payslip-section">
          <h3>{t('caretakerPayslips.monthlyPayslip')}</h3>
          <div className="payslip-table">
            <div className="payslip-row">
              <div className="payslip-label">{t('caretakerPayslips.baseAmount')}</div>
              <div className="payslip-value">{baseAmount.toFixed(2)} ₪</div>
            </div>
            {userIsAdmin && hasShevahEntries() && (
              <div className="payslip-row">
                <div className="payslip-label">{t('caretakerPayslips.paidByShevah')}</div>
                <div className="payslip-value">{shevahTotal.toFixed(2)} ₪</div>
              </div>
            )}
            {userIsAdmin && (
              <div className="payslip-row">
                <div className="payslip-label">{t('caretakerPayslips.remainingBaseAmount')}</div>
                <div className="payslip-value">{remainingBase.toFixed(2)} ₪</div>
              </div>
            )}
            {userIsAdmin && (
              <div className="payslip-row">
                <div className="payslip-label">{t('caretakerPayslips.pension')}</div>
                <div className="payslip-value">{pension.toFixed(2)} ₪</div>
              </div>
            )}
            {userIsAdmin && (
              <div className="payslip-row">
                <div className="payslip-label">{t('caretakerPayslips.firingPayment')}</div>
                <div className="payslip-value">{firingPayment.toFixed(2)} ₪</div>
              </div>
            )}
            <div className="payslip-row">
              <div className="payslip-label">{t('caretakerPayslips.bituahLeumi')} (3.6%)</div>
              <div className="payslip-value">{bituahLeumi.toFixed(2)} ₪</div>
            </div>
            {userIsAdmin && (
              <div className="payslip-row total">
                <div className="payslip-label">{t('common.total')}</div>
                <div className="payslip-value">{monthlyTotal.toFixed(2)} ₪</div>
              </div>
            )}
          </div>
          
          <div className="payment-status">
            <label>{t('caretakerPayslips.paymentStatus')}:</label>
            <div className="payment-status-select">
              <select 
                value={paymentStatus} 
                onChange={(e) => handlePaymentStatusChange(e.target.value)}
                className={`status-select status-${paymentStatus} status-badge status-badge-${paymentStatus}`}
                disabled={isReadOnly}
              >
                <option value="paid">{t('common.paid')}</option>
                <option value="pending">{t('common.pending')}</option>
                <option value="partial">{t('common.partial')}</option>
              </select>
            </div>
            {paymentStatus === 'partial' && (
              <div className="partial-payment-details">
                <div className="partial-payment-field">
                  <label>{t('caretakerPayslips.paidAmount', 'Paid Amount')}:</label>
                  <input
                    type="number"
                    value={monthlyPaidAmount}
                    onChange={(e) => handleMonthlyPaidAmountChange(e.target.value)}
                    step="0.01"
                    min="0"
                    max={monthlyTotal}
                    disabled={isReadOnly}
                  />
                  <span>₪</span>
                </div>
                <div className="partial-payment-field">
                  <label>{t('caretakerPayslips.remainingAmount', 'Remaining Amount')}:</label>
                  <div className="remaining-amount">
                    {(monthlyTotal - monthlyPaidAmount).toFixed(2)} ₪
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="payslip-section">
          <h3>{t('caretakerPayslips.monthlyOneTimePayments')}</h3>
          {monthlyOneTimePayments.length > 0 ? (
            <div className="payments-list">
              {monthlyOneTimePayments.map((payment, idx) => {
                const paidAmount = monthlyPaymentPaidAmounts[payment.id] || payment.paidAmount || 0
                const remainingAmount = payment.amount - paidAmount
                return (
                  <div key={payment.id || idx} className="payment-item">
                    <div className="payment-desc">{payment.description}</div>
                    <div className="payment-amount">{payment.amount.toFixed(2)} ₪</div>
                    <div className="payment-status-select">
                      <select 
                        value={payment.paymentStatus} 
                        onChange={(e) => handleMonthlyPaymentStatusChange(payment.id, e.target.value)}
                        className={`status-select status-${payment.paymentStatus}`}
                        disabled={isReadOnly}
                      >
                        <option value="paid">{t('common.paid')}</option>
                        <option value="pending">{t('common.pending')}</option>
                        <option value="partial">{t('common.partial')}</option>
                      </select>
                    </div>
                    {payment.paymentStatus === 'partial' && (
                      <div className="partial-payment-details payment-partial-details">
                        <div className="partial-payment-field">
                          <label>{t('caretakerPayslips.paidAmount', 'Paid Amount')}:</label>
                          <input
                            type="number"
                            value={paidAmount}
                            onChange={(e) => handleMonthlyPaymentPaidAmountChange(payment.id, e.target.value)}
                            step="0.01"
                            min="0"
                            max={payment.amount}
                            disabled={isReadOnly}
                          />
                          <span>₪</span>
                        </div>
                        <div className="partial-payment-field">
                          <label>{t('caretakerPayslips.remainingAmount', 'Remaining Amount')}:</label>
                          <div className="remaining-amount">
                            {remainingAmount.toFixed(2)} ₪
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
              <div className="payment-item total">
                <div className="payment-desc">{t('common.total')}</div>
                <div className="payment-amount">{monthlyOneTimeTotal.toFixed(2)} ₪</div>
                <div></div>
              </div>
            </div>
          ) : (
            <div className="no-payments">{t('caretakerPayslips.noAdditionalPayments')}</div>
          )}
        </div>
        
        <div className="payslip-section">
          <div className="section-header-with-selector">
            <h3>{t('caretakerPayslips.yearlyOneTimePayments')}</h3>
            {contractStartDate && (
              <div className="contract-year-selector">
                <label>{t('caretakerPayslips.contractYear', 'Contract Year')}:</label>
                <select 
                  value={selectedContractYear} 
                  onChange={(e) => setSelectedContractYear(parseInt(e.target.value))}
                  className="year-select"
                  disabled={isReadOnly}
                >
                  {getContractYears(contractStartDate, true).map(year => {
                    const formatDate = (d) => {
                      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                      return `${monthNames[d.getMonth()]} ${d.getFullYear()}`
                    }
                    return (
                      <option key={year.year} value={year.year}>
                        {year.label} ({formatDate(year.startDate)} - {formatDate(year.endDate)})
                      </option>
                    )
                  })}
                </select>
              </div>
            )}
          </div>
          <div className="yearly-payments">
            {visibleYearlyPayments.map((payment) => {
              
              const paidAmount = yearlyPaymentPaidAmounts[payment.key] || 0
              const remainingAmount = payment.amount - paidAmount
              // For Havraa, show the calculation (amount × days)
              const paymentLabel = payment.key === 'havraa' && payment.amountPerDay && payment.days
                ? `${t('caretakerPayslips.havraa')} (${payment.amountPerDay} × ${payment.days} ${t('settings.days', 'days')})`
                : t(`caretakerPayslips.${payment.key}`)
              return (
                <div key={payment.key} className="yearly-payment-row">
                  <label>{paymentLabel}:</label>
                  <span className="yearly-payment-amount">{payment.amount.toFixed(2)} ₪</span>
                  <div className="payment-status-select">
                    <select 
                      value={payment.paymentStatus} 
                      onChange={(e) => handleYearlyPaymentStatusChange(payment.key, e.target.value)}
                      className={`status-select status-${payment.paymentStatus}`}
                      disabled={isReadOnly}
                    >
                      <option value="paid">{t('common.paid')}</option>
                      <option value="pending">{t('common.pending')}</option>
                      <option value="partial">{t('common.partial')}</option>
                    </select>
                  </div>
                  {payment.paymentStatus === 'partial' && (
                    <div className="partial-payment-details payment-partial-details">
                      <div className="partial-payment-field">
                        <label>{t('caretakerPayslips.paidAmount', 'Paid Amount')}:</label>
                        <input
                          type="number"
                          value={paidAmount}
                          onChange={(e) => handleYearlyPaymentPaidAmountChange(payment.key, e.target.value)}
                          step="0.01"
                          min="0"
                          max={payment.amount}
                          disabled={isReadOnly}
                        />
                        <span>₪</span>
                      </div>
                      <div className="partial-payment-field">
                        <label>{t('caretakerPayslips.remainingAmount', 'Remaining Amount')}:</label>
                        <div className="remaining-amount">
                          {remainingAmount.toFixed(2)} ₪
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            <div className="yearly-payment-row total">
              <label>{t('common.total')}:</label>
              <span>{yearlyTotal.toFixed(2)} ₪</span>
              <div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CaretakerPayslips

