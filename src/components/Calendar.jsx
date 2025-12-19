import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay, addMonths, subMonths } from 'date-fns'
import { useTranslation } from 'react-i18next'
import './Calendar.css'

// Activity type colors - Pastel colors
const activityColors = {
  vacationDay: '#A8E6CF',      // Pastel Green
  sickDay: '#FFD3A5',          // Pastel Orange
  shabbat: '#A8C8EC',          // Pastel Blue
  pocketMoney: '#FFEAA7',      // Pastel Yellow
  hospitalVisit: '#FFB3BA',    // Pastel Red
  holidayVacation: '#D4A5E6'   // Pastel Purple
}

const Calendar = ({ selectedDate, onDateSelect, events = [], onAddActivity, onDeleteActivity, showAddActivity = false }) => {
  const { t, i18n } = useTranslation()
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date())
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [selectedDayForActivity, setSelectedDayForActivity] = useState(null)
  const [newActivityType, setNewActivityType] = useState('vacationDay')
  
  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(selectedDate)
    }
  }, [selectedDate])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Get first day of week (0 = Sunday, 6 = Saturday)
  const startDay = getDay(monthStart)
  
  // Create array with empty cells for days before month starts
  const emptyDays = Array(startDay).fill(null)
  
  // Combine empty days with actual days
  const allDays = [...emptyDays, ...daysInMonth]

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const handleToday = () => {
    setCurrentMonth(new Date())
  }

  const getDayEvents = (day) => {
    if (!day) return []
    return events.filter(event => {
      const eventDate = typeof event.date === 'string' ? new Date(event.date) : event.date
      return isSameDay(eventDate, day)
    })
  }

  const handleDayClick = (day) => {
    if (onDateSelect) {
      onDateSelect(day)
    }
    if (showAddActivity && onAddActivity) {
      setSelectedDayForActivity(day)
      setShowActivityModal(true)
    }
  }

  const getDayActivities = (day) => {
    if (!day) return []
    return events.filter(event => {
      const eventDate = typeof event.date === 'string' ? new Date(event.date) : event.date
      return isSameDay(eventDate, day)
    })
  }

  const handleAddActivityFromCalendar = () => {
    if (selectedDayForActivity && onAddActivity) {
      onAddActivity({
        type: newActivityType,
        date: format(selectedDayForActivity, 'yyyy-MM-dd')
      })
      setNewActivityType('vacationDay')
      // Don't close modal - allow adding more activities
    }
  }

  const handleDeleteActivityFromCalendar = (activityId) => {
    if (onDeleteActivity && activityId) {
      onDeleteActivity(activityId)
    }
  }

  const activityTypes = [
    { value: 'vacationDay', label: t('caretakerWorklog.vacationDay', 'Vacation Day') },
    { value: 'sickDay', label: t('caretakerWorklog.sickDay', 'Sick Day') },
    { value: 'shabbat', label: t('caretakerWorklog.shabbat', 'Shabbat') },
    { value: 'pocketMoney', label: t('caretakerWorklog.pocketMoney', 'Pocket Money') },
    { value: 'hospitalVisit', label: t('caretakerWorklog.hospitalVisit', 'Hospital Visit') },
    { value: 'holidayVacation', label: t('caretakerWorklog.holidayVacation', 'Holiday Vacation') }
  ]

  const weekDays = i18n.language === 'he' 
    ? ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button className="calendar-nav-button" onClick={handlePrevMonth}>←</button>
        <div className="calendar-month-year">
          {format(currentMonth, 'MMMM yyyy')}
        </div>
        <button className="calendar-nav-button" onClick={handleNextMonth}>→</button>
        <button className="calendar-today-button" onClick={handleToday}>{t('common.today')}</button>
      </div>
      <div className="calendar-grid">
        <div className="calendar-weekdays">
          {weekDays.map((day, index) => (
            <div key={index} className="calendar-weekday">{day}</div>
          ))}
        </div>
        <div className="calendar-days">
          {allDays.map((day, index) => {
            if (!day) {
              return <div key={index} className="calendar-day empty"></div>
            }
            const dayEvents = getDayEvents(day)
            const isSelected = selectedDate && isSameDay(day, selectedDate)
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isToday = isSameDay(day, new Date())

            // Get unique activity types for this day
            const dayActivityTypes = [...new Set(dayEvents.map(e => e.type))]
            const primaryActivityType = dayActivityTypes[0]
            const activityColor = primaryActivityType ? activityColors[primaryActivityType] : null

            return (
              <div
                key={day.toISOString()}
                className={`calendar-day ${isSelected ? 'selected' : ''} ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${dayActivityTypes.length > 0 ? 'has-activity' : ''}`}
                onClick={() => handleDayClick(day)}
                style={activityColor && !isSelected ? {
                  borderColor: activityColor,
                  borderWidth: '2px'
                } : {}}
              >
                <div className="calendar-day-number">{format(day, 'd')}</div>
                {dayEvents.length > 0 && (
                  <div className="calendar-day-events">
                    {dayActivityTypes.slice(0, 3).map((activityType, idx) => (
                      <div 
                        key={idx} 
                        className="calendar-event-dot" 
                        style={{ backgroundColor: activityColors[activityType] || '#e74c3c' }}
                        title={activityTypes.find(t => t.value === activityType)?.label || activityType}
                      ></div>
                    ))}
                    {dayActivityTypes.length > 3 && (
                      <div className="calendar-event-more">+{dayActivityTypes.length - 3}</div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      
      {showActivityModal && selectedDayForActivity && (
        <div className="calendar-activity-modal-overlay" onClick={() => setShowActivityModal(false)}>
          <div className="calendar-activity-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t('caretakerWorklog.addActivity', 'Add Activity')}</h3>
            <p className="modal-date">{format(selectedDayForActivity, 'EEEE, MMMM d, yyyy')}</p>
            
            {(() => {
              const dayActivities = getDayActivities(selectedDayForActivity)
              return dayActivities.length > 0 && (
                <div className="modal-existing-activities">
                  <h4>{t('caretakerWorklog.existingActivities', 'Existing Activities')}</h4>
                  <div className="existing-activities-list">
                    {dayActivities.map((activity, idx) => (
                      <div key={activity.id || idx} className="existing-activity-item">
                        <span 
                          className="activity-color-dot"
                          style={{ backgroundColor: activityColors[activity.type] || '#e74c3c' }}
                        ></span>
                        <span className="activity-type-name">
                          {activityTypes.find(t => t.value === activity.type)?.label || activity.type}
                        </span>
                        {onDeleteActivity && activity.id && (
                          <button
                            className="delete-activity-small"
                            onClick={() => handleDeleteActivityFromCalendar(activity.id)}
                            title={t('common.delete', 'Delete')}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
            
            <div className="modal-form-group">
              <label>{t('caretakerWorklog.activityType', 'Activity Type')}</label>
              <div className="activity-type-selector">
                {activityTypes.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    className={`activity-type-button ${newActivityType === type.value ? 'selected' : ''}`}
                    style={{
                      backgroundColor: activityColors[type.value],
                      borderColor: newActivityType === type.value ? '#000' : 'transparent',
                      borderWidth: newActivityType === type.value ? '2px' : '1px'
                    }}
                    onClick={() => setNewActivityType(type.value)}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="modal-button cancel" onClick={() => {
                setShowActivityModal(false)
                setSelectedDayForActivity(null)
                setNewActivityType('vacationDay')
              }}>
                {t('common.close', 'Close')}
              </button>
              <button className="modal-button save" onClick={handleAddActivityFromCalendar}>
                {t('common.add', 'Add')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Calendar

