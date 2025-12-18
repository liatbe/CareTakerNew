import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Calendar from '../components/Calendar'
import { storage } from '../utils/storage'
import { getCurrentMonthKey, getContractYear, getContractYearKey, getMonthKey, formatDate, parseISO } from '../utils/dateUtils'
import './Dashboard.css'

const Dashboard = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [tasks, setTasks] = useState([])
  const [calendarEvents, setCalendarEvents] = useState([])

  const loadTasks = () => {
    // Load tasks from worklog and payslips to determine open tasks
    const currentMonth = getCurrentMonthKey()
    const payslips = storage.get('payslips', {})
    const currentPayslip = payslips[currentMonth] || {}
    
    const openTasks = []
    
    // Always check for unpaid or partially paid monthly payslip
    // If paymentStatus is not set, default to 'pending' (new payslip)
    // Every month should have a payslip, so always show if not paid
    const monthlyPayslipStatus = currentPayslip.paymentStatus || 'pending'
    if (monthlyPayslipStatus !== 'paid') {
      const statusText = monthlyPayslipStatus === 'partial' 
        ? t('dashboard.monthlyPayslipPartial', 'Monthly payslip partially paid')
        : t('dashboard.monthlyPayslipPending', 'Monthly payslip payment pending')
      openTasks.push({
        id: 'monthly-payslip',
        title: t('navigation.caretakerPayslips'),
        description: statusText,
        status: monthlyPayslipStatus,
        link: '/caretaker-payslips'
      })
    }
    
    // Check for pending or partially paid monthly one-time payments
    // Get worklog activities for current month to see if there are any monthly payments
    const worklog = storage.get('worklog', {})
    const monthWorklog = worklog[currentMonth] || []
    const activityCharges = storage.get('activityCharges', {})
    
    // Find monthly one-time payments (shabbat, pocketMoney) from worklog
    const monthlyPaymentsFromWorklog = monthWorklog.filter(activity => 
      (activity.type === 'shabbat' || activity.type === 'pocketMoney') && 
      (activityCharges[activity.type] || 0) > 0
    )
    
    if (monthlyPaymentsFromWorklog.length > 0) {
      const monthlyPaymentStatuses = currentPayslip.monthlyPaymentStatuses || {}
      
      // For each payment from worklog, check its status (default to 'pending' if not set)
      const unpaidMonthlyPayments = monthlyPaymentsFromWorklog
        .map(activity => {
          const paymentId = `${activity.type}_${activity.date}`
          const status = monthlyPaymentStatuses[paymentId] || 'pending'
          return [paymentId, status]
        })
        .filter(([_, status]) => status !== 'paid')
      
      if (unpaidMonthlyPayments.length > 0) {
        const pendingCount = unpaidMonthlyPayments.filter(([_, status]) => status === 'pending').length
        const partialCount = unpaidMonthlyPayments.filter(([_, status]) => status === 'partial').length
        
        let description = ''
        if (pendingCount > 0 && partialCount > 0) {
          description = t('dashboard.monthlyPaymentsMixed', '{pending} pending, {partial} partially paid', { 
            pending: pendingCount, 
            partial: partialCount 
          })
        } else if (pendingCount > 0) {
          description = t('dashboard.monthlyPaymentsPending', '{count} monthly payment(s) pending', { count: pendingCount })
        } else if (partialCount > 0) {
          description = t('dashboard.monthlyPaymentsPartial', '{count} monthly payment(s) partially paid', { count: partialCount })
        }
        
        openTasks.push({
          id: 'monthly-payments',
          title: t('caretakerPayslips.monthlyOneTimePayments'),
          description: description,
          link: '/caretaker-payslips'
        })
      }
    }
    
    // Check for pending or partially paid yearly payments (for current contract year)
    const contractStartDate = storage.get('contractStartDate')
    if (contractStartDate) {
      const currentContractYear = getContractYear(new Date(), contractStartDate)
      const yearKey = `year_${currentContractYear}`
      const yearlyPaymentStatuses = currentPayslip.yearlyPaymentStatuses || {}
      const yearStatuses = yearlyPaymentStatuses[yearKey] || {}
      
      // Get yearly payments to check if they exist and have amounts > 0
      const yearlyPaymentsData = storage.get('yearlyPayments', {})
      const yearPayments = yearlyPaymentsData[yearKey] || {
        medicalInsurance: 0,
        taagidPayment: 0,
        taagidHandling: 0
      }
      
      // Check all yearly payments - if they have amounts > 0, they should have a status
      const paymentsWithAmounts = Object.entries(yearPayments)
        .filter(([key, amount]) => {
          // Exclude bituahLeumi if it exists
          if (key === 'bituahLeumi') return false
          return amount > 0
        })
      
      // For payments with amounts, check their status (default to 'pending' if not set)
      const unpaidYearlyPayments = paymentsWithAmounts
        .map(([key, _]) => {
          const status = yearStatuses[key] || 'pending'
          return [key, status]
        })
        .filter(([_, status]) => status !== 'paid')
      
      if (unpaidYearlyPayments.length > 0) {
        const pendingCount = unpaidYearlyPayments.filter(([_, status]) => status === 'pending').length
        const partialCount = unpaidYearlyPayments.filter(([_, status]) => status === 'partial').length
        
        let description = ''
        if (pendingCount > 0 && partialCount > 0) {
          description = t('dashboard.yearlyPaymentsMixed', '{pending} pending, {partial} partially paid', { 
            pending: pendingCount, 
            partial: partialCount 
          })
        } else if (pendingCount > 0) {
          description = t('dashboard.yearlyPaymentsPending', '{count} yearly payment(s) pending', { count: pendingCount })
        } else if (partialCount > 0) {
          description = t('dashboard.yearlyPaymentsPartial', '{count} yearly payment(s) partially paid', { count: partialCount })
        }
        
        openTasks.push({
          id: 'yearly-payments',
          title: t('caretakerPayslips.yearlyOneTimePayments'),
          description: description,
          link: '/caretaker-payslips'
        })
      }
    }
    
    setTasks(openTasks)
  }

  const loadCalendarEvents = () => {
    const worklog = storage.get('worklog', {})
    const allActivities = []
    Object.keys(worklog).forEach(monthKey => {
      worklog[monthKey].forEach(activity => {
        allActivities.push({
          id: activity.id,
          date: activity.date,
          type: activity.type
        })
      })
    })
    setCalendarEvents(allActivities)
  }

  const handleAddActivityFromCalendar = (activity) => {
    const worklog = storage.get('worklog', {})
    const monthKey = getMonthKey(parseISO(activity.date))
    
    if (!worklog[monthKey]) {
      worklog[monthKey] = []
    }
    
    const newActivity = {
      id: Date.now(),
      ...activity
    }
    
    worklog[monthKey].push(newActivity)
    storage.set('worklog', worklog)
    loadCalendarEvents()
  }

  const handleDeleteActivityFromCalendar = (activityId) => {
    if (window.confirm(t('common.confirmDelete', 'Are you sure you want to delete this activity?'))) {
      const worklog = storage.get('worklog', {})
      Object.keys(worklog).forEach(monthKey => {
        worklog[monthKey] = worklog[monthKey].filter(a => a.id !== activityId)
      })
      storage.set('worklog', worklog)
      loadCalendarEvents()
      loadTasks() // Refresh tasks as well
    }
  }

  useEffect(() => {
    // Scroll to top when dashboard loads
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    loadTasks()
    loadCalendarEvents()
    // Refresh tasks when window gains focus (user returns to tab)
    const handleFocus = () => {
      loadTasks()
      loadCalendarEvents()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, selectedDate])

  const quickActions = [
    { label: t('navigation.elderFinancials'), path: '/elder-financials' },
    { label: t('navigation.elderExpenses'), path: '/elder-expenses' },
    { label: t('navigation.caretakerPayslips'), path: '/caretaker-payslips' },
    { label: t('navigation.caretakerWorklog'), path: '/caretaker-worklog' }
  ]

  return (
    <div className="dashboard">
      <h1 className="page-title">{t('dashboard.title')}</h1>
      
      <div className="dashboard-grid">
        <div className="dashboard-section calendar-section">
          <h2 className="section-title">{t('dashboard.calendar')}</h2>
          <Calendar 
            selectedDate={selectedDate} 
            onDateSelect={setSelectedDate}
            events={calendarEvents}
            onAddActivity={handleAddActivityFromCalendar}
            onDeleteActivity={handleDeleteActivityFromCalendar}
            showAddActivity={true}
          />
        </div>
        
        <div className="dashboard-section tasks-section">
          <div className="tasks-header">
            <h2 className="section-title">{t('dashboard.openTasks')}</h2>
            <button 
              className="refresh-tasks-button" 
              onClick={loadTasks}
              title={t('dashboard.refreshTasks', 'Refresh tasks')}
            >
              ↻
            </button>
          </div>
          {tasks.length > 0 ? (
            <div className="tasks-list">
              {tasks.map(task => (
                <div 
                  key={task.id} 
                  className={`task-item ${task.status === 'partial' ? 'task-partial' : ''}`}
                  onClick={() => navigate(task.link)}
                >
                  <div className="task-title">{task.title}</div>
                  <div className="task-description">{task.description}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-tasks">{t('dashboard.noTasks')}</div>
          )}
        </div>
        
        <div className="dashboard-section quick-actions-section">
          <h2 className="section-title">{t('dashboard.quickActions')}</h2>
          <div className="quick-actions-grid">
            {quickActions.map(action => (
              <button
                key={action.path}
                className="quick-action-button"
                onClick={() => navigate(action.path)}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

