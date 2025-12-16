import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { storage } from '../utils/storage'
import { parseISO, getYearFromDate, getContractYear, getContractYears } from '../utils/dateUtils'
import './Settings.css'

const Settings = () => {
  const { t } = useTranslation()
  const [contractStartDate, setContractStartDate] = useState('')
  const [monthlyBaseAmount, setMonthlyBaseAmount] = useState(6250)
  const [activityCharges, setActivityCharges] = useState({
    vacationDay: 250,
    sickDay: 0,
    shabbat: 426.4,
    pocketMoney: 100,
    hospitalVisit: 0,
    holidayVacationDay: 426.4
  })
  const [selectedContractYear, setSelectedContractYear] = useState(0)
  const [yearlyPayments, setYearlyPayments] = useState({
    medicalInsurance: 0,
    taagidPayment: 0,
    taagidHandling: 0
  })
  const [expectedExpenses, setExpectedExpenses] = useState(null)
  const [calculationParams, setCalculationParams] = useState({
    vacationDaysPerYear: 12,
    holidayVacationDaysPerYear: 12,
    pocketMoneyWeeksPerYear: 52,
    shabbatPerMonth: 3,
    shabbatMonthsPerYear: 12
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = () => {
    const startDate = storage.get('contractStartDate')
    if (startDate) setContractStartDate(startDate)
    
    const baseAmount = storage.get('monthlyBaseAmount', 6250)
    setMonthlyBaseAmount(baseAmount)
    
    const charges = storage.get('activityCharges', {
      vacationDay: 250,
      sickDay: 0,
      shabbat: 426.4,
      pocketMoney: 100,
      hospitalVisit: 0,
      holidayVacationDay: 426.4
    })
    setActivityCharges(charges)
    
    // Load yearly payments for current contract year
    if (startDate) {
      const currentContractYear = getContractYear(new Date(), startDate)
      setSelectedContractYear(currentContractYear)
      const yearKey = `year_${currentContractYear}`
      const yearlyPaymentsData = storage.get('yearlyPayments', {})
      const yearly = yearlyPaymentsData[yearKey] || {
        medicalInsurance: 0,
        taagidPayment: 0,
        taagidHandling: 0
      }
      // Remove bituahLeumi if it exists (for backward compatibility)
      const { bituahLeumi, ...paymentsWithoutBituah } = yearly
      setYearlyPayments(paymentsWithoutBituah)
    } else {
      const yearly = storage.get('yearlyPayments', {
        medicalInsurance: 0,
        taagidPayment: 0,
        taagidHandling: 0
      })
      // Remove bituahLeumi if it exists
      const { bituahLeumi, ...paymentsWithoutBituah } = yearly
      setYearlyPayments(paymentsWithoutBituah)
    }
  }

  const handleContractStartDateChange = (date) => {
    setContractStartDate(date)
    storage.set('contractStartDate', date)
    
    // Reload yearly payments for new contract year
    if (date) {
      const currentContractYear = getContractYear(new Date(), date)
      setSelectedContractYear(currentContractYear)
      const yearKey = `year_${currentContractYear}`
      const yearlyPaymentsData = storage.get('yearlyPayments', {})
      const yearly = yearlyPaymentsData[yearKey] || {
        medicalInsurance: 0,
        taagidPayment: 0,
        taagidHandling: 0
      }
      // Remove bituahLeumi if it exists (for backward compatibility)
      const { bituahLeumi, ...paymentsWithoutBituah } = yearly
      setYearlyPayments(paymentsWithoutBituah)
    }
  }

  const handleMonthlyBaseAmountChange = (amount) => {
    const value = parseFloat(amount) || 0
    setMonthlyBaseAmount(value)
    storage.set('monthlyBaseAmount', value)
  }

  const handleActivityChargeChange = (key, value) => {
    const updated = { ...activityCharges, [key]: parseFloat(value) || 0 }
    setActivityCharges(updated)
    storage.set('activityCharges', updated)
  }

  const handleYearlyPaymentChange = (key, value) => {
    const updated = { ...yearlyPayments, [key]: parseFloat(value) || 0 }
    setYearlyPayments(updated)
    
    // Save per contract year
    if (contractStartDate) {
      const yearKey = `year_${selectedContractYear}`
      const yearlyPaymentsData = storage.get('yearlyPayments', {})
      yearlyPaymentsData[yearKey] = updated
      storage.set('yearlyPayments', yearlyPaymentsData)
    } else {
      storage.set('yearlyPayments', updated)
    }
  }

  const handleContractYearChange = (year) => {
    setSelectedContractYear(year)
    const yearKey = `year_${year}`
    const yearlyPaymentsData = storage.get('yearlyPayments', {})
    const yearly = yearlyPaymentsData[yearKey] || {
      medicalInsurance: 0,
      taagidPayment: 0,
      taagidHandling: 0
    }
    // Remove bituahLeumi if it exists (for backward compatibility)
    const { bituahLeumi, ...paymentsWithoutBituah } = yearly
    setYearlyPayments(paymentsWithoutBituah)
  }

  const calculateExpectedYearlyExpenses = () => {
    if (!contractStartDate) {
      alert(t('settings.contractStartDateRequired', 'Please set contract start date first'))
      return
    }

    const baseAmount = monthlyBaseAmount
    // For expected expenses, assume no Shevah coverage (worst case scenario)
    // So remainingBase = baseAmount
    const remainingBase = baseAmount
    const pension = remainingBase * 0.065
    const firingPayment = remainingBase * 0.0833
    const havraa = 174
    const bituahLeumi = remainingBase * 0.036
    // Monthly total = base + pension + firing payment + havraa + bituah leumi
    const monthlyTotal = remainingBase + pension + firingPayment + havraa + bituahLeumi
    
    // Yearly calculations
    const yearlyBase = monthlyTotal * 12
    
    // Vacation days (editable per year)
    const vacationDaysCost = activityCharges.vacationDay * calculationParams.vacationDaysPerYear
    
    // Holiday vacation days (editable per year)
    const holidayVacationDaysCost = activityCharges.holidayVacationDay * calculationParams.holidayVacationDaysPerYear
    
    // Pocket money (editable weeks per year)
    const pocketMoneyCost = activityCharges.pocketMoney * calculationParams.pocketMoneyWeeksPerYear
    
    // Shabbat (editable per month × editable months per year)
    const shabbatCost = activityCharges.shabbat * calculationParams.shabbatPerMonth * calculationParams.shabbatMonthsPerYear
    
    // Yearly one-time payments (for current contract year)
    const currentContractYear = getContractYear(new Date(), contractStartDate)
    const yearKey = `year_${currentContractYear}`
    const yearlyPaymentsData = storage.get('yearlyPayments', {})
    const yearPayments = yearlyPaymentsData[yearKey] || {
      medicalInsurance: 0,
      taagidPayment: 0,
      taagidHandling: 0
    }
    // Remove bituahLeumi if it exists (it's now in monthly payslip, not yearly payments)
    const { bituahLeumi: _, ...paymentsWithoutBituah } = yearPayments
    const yearlyOneTimeTotal = Object.values(paymentsWithoutBituah).reduce((sum, v) => sum + v, 0)
    
    const total = yearlyBase + vacationDaysCost + holidayVacationDaysCost + pocketMoneyCost + shabbatCost + yearlyOneTimeTotal
    
    setExpectedExpenses({
      yearlyBase,
      vacationDaysCost,
      holidayVacationDaysCost,
      pocketMoneyCost,
      shabbatCost,
      yearlyOneTimeTotal,
      total,
      calculationParams
    })
  }

  const handleCalculationParamChange = (key, value) => {
    const updated = { ...calculationParams, [key]: parseFloat(value) || 0 }
    setCalculationParams(updated)
    storage.set('calculationParams', updated)
  }

  const activityChargeLabels = {
    vacationDay: t('settings.vacationDay'),
    sickDay: t('settings.sickDay'),
    shabbat: t('settings.shabbatCharge', 'Shabbat'),
    pocketMoney: t('settings.pocketMoney'),
    hospitalVisit: t('settings.hospitalVisit'),
    holidayVacationDay: t('settings.holidayVacationDay')
  }

  return (
    <div className="settings">
      <h1 className="page-title">{t('settings.title')}</h1>
      
      <div className="settings-grid">
        <div className="settings-section">
          <h2>{t('settings.contractDetails')}</h2>
          <div className="settings-card">
            <div className="setting-item">
              <label>{t('settings.contractStartDate')}</label>
              <input
                type="date"
                value={contractStartDate}
                onChange={(e) => handleContractStartDateChange(e.target.value)}
              />
            </div>
            <div className="setting-item">
              <label>{t('settings.monthlyBaseAmount')}</label>
              <input
                type="number"
                value={monthlyBaseAmount}
                onChange={(e) => handleMonthlyBaseAmountChange(e.target.value)}
                step="0.01"
              />
              <span>₪</span>
            </div>
          </div>
        </div>
        
        <div className="settings-section">
          <h2>{t('settings.activityCharges')}</h2>
          <div className="settings-card">
            {Object.entries(activityCharges).map(([key, value]) => (
              <div key={key} className="setting-item">
                <label>{activityChargeLabels[key]}</label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => handleActivityChargeChange(key, e.target.value)}
                  step="0.01"
                />
                <span>₪</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="settings-section">
          <div className="settings-section-header">
            <h2>{t('settings.yearlyPayments', 'Yearly One-Time Payments')}</h2>
            {contractStartDate && (
              <div className="contract-year-selector">
                <label>{t('caretakerPayslips.contractYear', 'Contract Year')}:</label>
                <select 
                  value={selectedContractYear} 
                  onChange={(e) => handleContractYearChange(parseInt(e.target.value))}
                  className="year-select"
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
          <div className="settings-card">
            {Object.entries(yearlyPayments).map(([key, value]) => (
              <div key={key} className="setting-item">
                <label>{t(`caretakerPayslips.${key}`)}</label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => handleYearlyPaymentChange(key, e.target.value)}
                  step="0.01"
                />
                <span>₪</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="settings-section full-width">
          <h2>{t('settings.expectedYearlyExpenses')}</h2>
          <div className="settings-card">
            <div className="calculation-formula-section">
              <h3>{t('settings.calculationFormula', 'Calculation Formula Parameters')}</h3>
              <div className="formula-params-grid">
                <div className="formula-param-item">
                  <label>{t('settings.vacationDaysPerYear', 'Vacation Days per Year')}:</label>
                  <input
                    type="number"
                    value={calculationParams.vacationDaysPerYear}
                    onChange={(e) => handleCalculationParamChange('vacationDaysPerYear', e.target.value)}
                    min="0"
                    step="1"
                  />
                  <span className="formula-text">× {activityCharges.vacationDay.toFixed(2)} ₪</span>
                </div>
                <div className="formula-param-item">
                  <label>{t('settings.holidayVacationDaysPerYear', 'Holiday Vacation Days per Year')}:</label>
                  <input
                    type="number"
                    value={calculationParams.holidayVacationDaysPerYear}
                    onChange={(e) => handleCalculationParamChange('holidayVacationDaysPerYear', e.target.value)}
                    min="0"
                    step="1"
                  />
                  <span className="formula-text">× {activityCharges.holidayVacationDay.toFixed(2)} ₪</span>
                </div>
                <div className="formula-param-item">
                  <label>{t('settings.pocketMoneyWeeksPerYear', 'Pocket Money Weeks per Year')}:</label>
                  <input
                    type="number"
                    value={calculationParams.pocketMoneyWeeksPerYear}
                    onChange={(e) => handleCalculationParamChange('pocketMoneyWeeksPerYear', e.target.value)}
                    min="0"
                    step="1"
                  />
                  <span className="formula-text">× {activityCharges.pocketMoney.toFixed(2)} ₪</span>
                </div>
                <div className="formula-param-item">
                  <label>{t('settings.shabbatPerMonth', 'Shabbat per Month')}:</label>
                  <input
                    type="number"
                    value={calculationParams.shabbatPerMonth}
                    onChange={(e) => handleCalculationParamChange('shabbatPerMonth', e.target.value)}
                    min="0"
                    step="1"
                  />
                  <span className="formula-text">× {calculationParams.shabbatMonthsPerYear} months × {activityCharges.shabbat.toFixed(2)} ₪</span>
                </div>
                <div className="formula-param-item">
                  <label>{t('settings.shabbatMonthsPerYear', 'Shabbat Months per Year')}:</label>
                  <input
                    type="number"
                    value={calculationParams.shabbatMonthsPerYear}
                    onChange={(e) => handleCalculationParamChange('shabbatMonthsPerYear', e.target.value)}
                    min="0"
                    max="12"
                    step="1"
                  />
                </div>
              </div>
            </div>
            
            <button 
              className="calculate-button"
              onClick={calculateExpectedYearlyExpenses}
            >
              {t('settings.calculate')}
            </button>
            
            {expectedExpenses && (
              <div className="expected-expenses-results">
                <div className="expense-row">
                  <span>{t('settings.yearlyBase', 'Yearly Base (12 months)')}</span>
                  <strong>{expectedExpenses.yearlyBase.toFixed(2)} ₪</strong>
                </div>
                <div className="expense-row">
                  <span>{t('settings.vacationDays', 'Vacation Days')} ({expectedExpenses.calculationParams.vacationDaysPerYear} {t('settings.days', 'days')})</span>
                  <strong>{expectedExpenses.vacationDaysCost.toFixed(2)} ₪</strong>
                </div>
                <div className="expense-row">
                  <span>{t('settings.holidayVacationDays', 'Holiday Vacation Days')} ({expectedExpenses.calculationParams.holidayVacationDaysPerYear} {t('settings.days', 'days')})</span>
                  <strong>{expectedExpenses.holidayVacationDaysCost.toFixed(2)} ₪</strong>
                </div>
                <div className="expense-row">
                  <span>{t('settings.pocketMoney', 'Pocket Money')} ({expectedExpenses.calculationParams.pocketMoneyWeeksPerYear} {t('settings.weeks', 'weeks')})</span>
                  <strong>{expectedExpenses.pocketMoneyCost.toFixed(2)} ₪</strong>
                </div>
                <div className="expense-row">
                  <span>{t('settings.shabbatLabel', 'Shabbat')} ({expectedExpenses.calculationParams.shabbatPerMonth} × {expectedExpenses.calculationParams.shabbatMonthsPerYear} {t('settings.months', 'months')})</span>
                  <strong>{expectedExpenses.shabbatCost.toFixed(2)} ₪</strong>
                </div>
                <div className="expense-row">
                  <span>{t('settings.yearlyOneTime', 'Yearly One-Time Payments')}</span>
                  <strong>{expectedExpenses.yearlyOneTimeTotal.toFixed(2)} ₪</strong>
                </div>
                <div className="expense-row total">
                  <span>{t('common.total')}</span>
                  <strong>{expectedExpenses.total.toFixed(2)} ₪</strong>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings

