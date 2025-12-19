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
    const yearPayments = yearlyPaymentsData[yearKey] || {
      medicalInsurance: 0,
      taagidPayment: 0,
      taagidHandling: 0
    }
    
    // Remove bituahLeumi if it exists (for backward compatibility)
    const { bituahLeumi, ...paymentsWithoutBituah } = yearPayments
    
    const payslips = storage.get('payslips', {})
    const currentPayslip = payslips[currentMonthKey] || {}
    const yearlyPaymentStatuses = currentPayslip.yearlyPaymentStatuses || {}
    const yearStatuses = yearlyPaymentStatuses[yearKey] || {}
    
    // Add payment status to each payment
    return Object.entries(paymentsWithoutBituah).map(([key, value]) => ({
      key,
      amount: value,
      paymentStatus: yearStatuses[key] || 'pending'
    }))
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
      const havraa = 174
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
        havraa,
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
        [t('caretakerPayslips.havraa')]: payslipData.havraa,
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
          [t('caretakerPayslips.havraa')]: '',
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
          taagidPayment: 0,
          taagidHandling: 0
        }
        
        // Remove bituahLeumi if it exists
        const { bituahLeumi, ...paymentsWithoutBituah } = yearPayments
        
        // Create a row for each yearly payment
        Object.entries(paymentsWithoutBituah).forEach(([key, amount]) => {
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
              [t('caretakerPayslips.havraa')]: '',
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
  const havraa = 174
  const bituahLeumi = remainingBase * 0.036
  const monthlyTotal = remainingBase + pension + firingPayment + havraa + bituahLeumi
  const monthlyOneTimePayments = getMonthlyOneTimePayments()
  const monthlyOneTimeTotal = monthlyOneTimePayments.reduce((sum, p) => sum + p.amount, 0)
  const yearlyPayments = getYearlyPayments()
  const yearlyTotal = yearlyPayments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="caretaker-payslips">
      <h1 className="page-title">{t('caretakerPayslips.title')}</h1>
      
      <MonthSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
      
      <div className="content-card">
        <div className="card-header">
          <h2>{t('caretakerPayslips.title')}</h2>
          {!isReadOnly && (
            <button className="export-button" onClick={handleExport}>
              {t('common.export')}
            </button>
          )}
        </div>
        
        <div className="contract-info">
          <div className="info-row">
            <label>{t('caretakerPayslips.contractStartDate')}:</label>
            <input
              type="date"
              value={contractStartDate}
              onChange={(e) => {
                setContractStartDate(e.target.value)
                storage.set('contractStartDate', e.target.value)
              }}
              disabled={isReadOnly}
            />
          </div>
          <div className="info-row">
            <label>{t('caretakerPayslips.monthlyBaseAmount')} ({currentYear}):</label>
            {editingYear === currentYear ? (
              <input
                type="number"
                value={baseAmount}
                onChange={(e) => handleYearlyBaseAmountChange(currentYear, e.target.value)}
                onBlur={() => setEditingYear(null)}
                step="0.01"
                disabled={isReadOnly}
              />
            ) : (
              <span onClick={() => !isReadOnly && setEditingYear(currentYear)} style={{ cursor: isReadOnly ? 'default' : 'pointer' }}>
                {baseAmount.toFixed(2)} ₪
              </span>
            )}
          </div>
        </div>
        
        <div className="payslip-section">
          <h3>{t('caretakerPayslips.monthlyPayslip')}</h3>
          <div className="payslip-table">
            <div className="payslip-row">
              <div className="payslip-label">{t('caretakerPayslips.baseAmount')}</div>
              <div className="payslip-value">{baseAmount.toFixed(2)} ₪</div>
            </div>
            {hasShevahEntries() && (
              <div className="payslip-row">
                <div className="payslip-label">{t('caretakerPayslips.paidByShevah')}</div>
                <div className="payslip-value">{shevahTotal.toFixed(2)} ₪</div>
              </div>
            )}
            <div className="payslip-row">
              <div className="payslip-label">{t('caretakerPayslips.remainingBaseAmount')}</div>
              <div className="payslip-value">{remainingBase.toFixed(2)} ₪</div>
            </div>
            <div className="payslip-row">
              <div className="payslip-label">{t('caretakerPayslips.pension')}</div>
              <div className="payslip-value">{pension.toFixed(2)} ₪</div>
            </div>
            <div className="payslip-row">
              <div className="payslip-label">{t('caretakerPayslips.firingPayment')}</div>
              <div className="payslip-value">{firingPayment.toFixed(2)} ₪</div>
            </div>
            <div className="payslip-row">
              <div className="payslip-label">{t('caretakerPayslips.havraa')}</div>
              <div className="payslip-value">{havraa.toFixed(2)} ₪</div>
            </div>
            <div className="payslip-row">
              <div className="payslip-label">{t('caretakerPayslips.bituahLeumi')} (3.6%)</div>
              <div className="payslip-value">{bituahLeumi.toFixed(2)} ₪</div>
            </div>
            <div className="payslip-row total">
              <div className="payslip-label">{t('common.total')}</div>
              <div className="payslip-value">{monthlyTotal.toFixed(2)} ₪</div>
            </div>
          </div>
          
          <div className="payment-status">
            <label>{t('caretakerPayslips.paymentStatus')}:</label>
            <div className="payment-status-select">
              <select 
                value={paymentStatus} 
                onChange={(e) => handlePaymentStatusChange(e.target.value)}
                className={`status-select status-${paymentStatus}`}
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
            {yearlyPayments.map((payment) => {
              const paidAmount = yearlyPaymentPaidAmounts[payment.key] || 0
              const remainingAmount = payment.amount - paidAmount
              return (
                <div key={payment.key} className="yearly-payment-row">
                  <label>{t(`caretakerPayslips.${payment.key}`)}:</label>
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

