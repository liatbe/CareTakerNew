import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Calendar from '../components/Calendar'
import { storage } from '../utils/storage'
import { getMonthKey, formatDate, parseISO, isSameDay, isWithinInterval, getYearFromDate } from '../utils/dateUtils'
import { logAction } from '../utils/actionLogger'
import './CaretakerWorklog.css'

// Activity type colors (matching Calendar component)
const activityColors = {
  vacationDay: '#34C759',      // Green
  sickDay: '#FF9500',          // Orange
  shabbat: '#007AFF',          // Blue
  pocketMoney: '#FFCC00',      // Yellow
  hospitalVisit: '#FF3B30',    // Red
  holidayVacation: '#AF52DE'   // Purple
}

const CaretakerWorklog = () => {
  const { t } = useTranslation()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [activities, setActivities] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newActivity, setNewActivity] = useState({ type: 'vacationDay', date: formatDate(new Date()) })

  const activityTypes = [
    { value: 'vacationDay', label: t('caretakerWorklog.vacationDay') },
    { value: 'sickDay', label: t('caretakerWorklog.sickDay') },
    { value: 'shabbat', label: t('caretakerWorklog.shabbat') },
    { value: 'pocketMoney', label: t('caretakerWorklog.pocketMoney') },
    { value: 'hospitalVisit', label: t('caretakerWorklog.hospitalVisit') },
    { value: 'holidayVacation', label: t('caretakerWorklog.holidayVacation') }
  ]

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = () => {
    const worklog = storage.get('worklog', {})
    const allActivities = []
    Object.keys(worklog).forEach(monthKey => {
      worklog[monthKey].forEach(activity => {
        allActivities.push({
          ...activity,
          date: activity.date
        })
      })
    })
    setActivities(allActivities)
  }

  const saveActivity = (activity) => {
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
    
    // Log action for caretakers
    logAction('add_activity', {
      activityType: activity.type,
      date: activity.date,
      activityId: newActivity.id
    })
    
    loadActivities()
    // Force calendar refresh by updating selected date
    setSelectedDate(new Date(selectedDate))
  }

  const handleAddActivity = () => {
    if (!newActivity.date) return
    saveActivity(newActivity)
    setNewActivity({ type: 'vacationDay', date: formatDate(new Date()) })
    setShowAddForm(false)
  }

  const handleAddActivityFromCalendar = (activity) => {
    saveActivity(activity)
  }

  const handleDeleteActivity = (id) => {
    if (window.confirm(t('common.confirmDelete', 'Are you sure you want to delete this activity?'))) {
      const worklog = storage.get('worklog', {})
      let deletedActivity = null
      Object.keys(worklog).forEach(monthKey => {
        const activity = worklog[monthKey].find(a => a.id === id)
        if (activity) {
          deletedActivity = activity
        }
        worklog[monthKey] = worklog[monthKey].filter(a => a.id !== id)
      })
      
      storage.set('worklog', worklog)
      
      // Log action for caretakers
      if (deletedActivity) {
        logAction('delete_activity', {
          activityType: deletedActivity.type,
          date: deletedActivity.date,
          activityId: id
        })
      }
      
      loadActivities()
    }
  }

  const getCalendarEvents = () => {
    return activities.map(a => ({
      id: a.id,
      date: a.date,
      type: a.type
    }))
  }

  const getVacationDaysSummary = () => {
    const contractStartDate = storage.get('contractStartDate')
    if (!contractStartDate) return { total: 12, used: 0, remaining: 12 }
    
    const startDate = parseISO(contractStartDate)
    const currentDate = new Date()
    const currentYear = getYearFromDate(currentDate)
    
    // Calculate year start (contract start date anniversary)
    const yearStart = new Date(currentYear, startDate.getMonth(), startDate.getDate())
    const yearEnd = new Date(currentYear + 1, startDate.getMonth(), startDate.getDate())
    
    // If current date is before anniversary, use previous year
    const actualYearStart = currentDate < yearStart 
      ? new Date(currentYear - 1, startDate.getMonth(), startDate.getDate())
      : yearStart
    const actualYearEnd = currentDate < yearStart
      ? yearStart
      : yearEnd
    
    const used = activities.filter(a => {
      const activityDate = parseISO(a.date)
      return a.type === 'vacationDay' && 
             isWithinInterval(activityDate, { start: actualYearStart, end: actualYearEnd })
    }).length
    
    return { total: 12, used, remaining: Math.max(0, 12 - used) }
  }

  const getHolidayVacationDaysSummary = () => {
    const contractStartDate = storage.get('contractStartDate')
    if (!contractStartDate) return { total: 12, used: 0, remaining: 12 }
    
    const startDate = parseISO(contractStartDate)
    const currentDate = new Date()
    const currentYear = getYearFromDate(currentDate)
    
    const yearStart = new Date(currentYear, startDate.getMonth(), startDate.getDate())
    const yearEnd = new Date(currentYear + 1, startDate.getMonth(), startDate.getDate())
    
    const actualYearStart = currentDate < yearStart 
      ? new Date(currentYear - 1, startDate.getMonth(), startDate.getDate())
      : yearStart
    const actualYearEnd = currentDate < yearStart
      ? yearStart
      : yearEnd
    
    const used = activities.filter(a => {
      const activityDate = parseISO(a.date)
      return a.type === 'holidayVacation' && 
             isWithinInterval(activityDate, { start: actualYearStart, end: actualYearEnd })
    }).length
    
    return { total: 12, used, remaining: Math.max(0, 12 - used) }
  }

  const vacationSummary = getVacationDaysSummary()
  const holidaySummary = getHolidayVacationDaysSummary()

  return (
    <div className="caretaker-worklog">
      <h1 className="page-title">{t('caretakerWorklog.title')}</h1>
      
      <div className="worklog-grid">
        <div className="calendar-section">
          <Calendar 
            selectedDate={selectedDate} 
            onDateSelect={setSelectedDate}
            events={getCalendarEvents()}
            onAddActivity={handleAddActivityFromCalendar}
            onDeleteActivity={handleDeleteActivity}
            showAddActivity={true}
          />
        </div>
        
        <div className="activities-section">
          <div className="section-header">
            <h2>{t('caretakerWorklog.addActivity')}</h2>
            <button 
              className="add-activity-button"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? t('common.cancel') : t('common.add')}
            </button>
          </div>
          
          {showAddForm && (
            <div className="add-activity-form">
              <div className="form-group">
                <label>{t('caretakerWorklog.activityType')}</label>
                <select
                  value={newActivity.type}
                  onChange={(e) => setNewActivity({ ...newActivity, type: e.target.value })}
                >
                  {activityTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{t('common.date')}</label>
                <input
                  type="date"
                  value={newActivity.date}
                  onChange={(e) => setNewActivity({ ...newActivity, date: e.target.value })}
                />
              </div>
              <button className="save-button" onClick={handleAddActivity}>
                {t('common.save')}
              </button>
            </div>
          )}
          
          <div className="activities-list">
            <h3>{t('caretakerWorklog.activities', 'Activities')}</h3>
            {activities.length > 0 ? (
              <div className="activities-table">
                {activities.map(activity => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-date">{formatDate(activity.date, 'yyyy-MM-dd')}</div>
                    <div 
                      className="activity-type"
                      style={{ 
                        color: activityColors[activity.type] || 'var(--ios-label)',
                        fontWeight: 600
                      }}
                    >
                      <span 
                        className="activity-type-indicator"
                        style={{ backgroundColor: activityColors[activity.type] || '#e74c3c' }}
                      ></span>
                      {activityTypes.find(t => t.value === activity.type)?.label || activity.type}
                    </div>
                    <button
                      className="delete-activity-button"
                      onClick={() => handleDeleteActivity(activity.id)}
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-activities">{t('common.noEntries', 'No activities yet')}</div>
            )}
          </div>
        </div>
        
        <div className="summary-section">
          <div className="summary-card">
            <h3>{t('caretakerWorklog.vacationDaysSummary')}</h3>
            <div className="summary-item">
              <span>{t('caretakerWorklog.totalVacationDays')}</span>
              <strong>{vacationSummary.total}</strong>
            </div>
            <div className="summary-item">
              <span>{t('caretakerWorklog.usedVacationDays')}</span>
              <strong>{vacationSummary.used}</strong>
            </div>
            <div className="summary-item">
              <span>{t('caretakerWorklog.remainingVacationDays')}</span>
              <strong>{vacationSummary.remaining}</strong>
            </div>
          </div>
          
          <div className="summary-card">
            <h3>{t('caretakerWorklog.holidayVacationDaysSummary')}</h3>
            <div className="summary-item">
              <span>{t('caretakerWorklog.totalHolidayVacationDays')}</span>
              <strong>{holidaySummary.total}</strong>
            </div>
            <div className="summary-item">
              <span>{t('caretakerWorklog.usedHolidayVacationDays')}</span>
              <strong>{holidaySummary.used}</strong>
            </div>
            <div className="summary-item">
              <span>{t('caretakerWorklog.remainingHolidayVacationDays')}</span>
              <strong>{holidaySummary.remaining}</strong>
            </div>
          </div>
          
          <div className="summary-note">
            <p>{t('caretakerWorklog.yearStartsAt')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CaretakerWorklog

