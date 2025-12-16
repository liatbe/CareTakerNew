import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { format, addMonths, subMonths, parseISO } from 'date-fns'
import './MonthSelector.css'

const MonthSelector = ({ selectedDate, onDateChange }) => {
  const { t, i18n } = useTranslation()
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date())

  const handlePrevMonth = () => {
    const newDate = subMonths(currentDate, 1)
    setCurrentDate(newDate)
    onDateChange(newDate)
  }

  const handleNextMonth = () => {
    const newDate = addMonths(currentDate, 1)
    setCurrentDate(newDate)
    onDateChange(newDate)
  }

  const handleToday = () => {
    const today = new Date()
    setCurrentDate(today)
    onDateChange(today)
  }

  const formatMonthYear = (date) => {
    const d = typeof date === 'string' ? parseISO(date) : date
    if (i18n.language === 'he') {
      // Hebrew month names
      const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']
      return `${months[d.getMonth()]} ${d.getFullYear()}`
    }
    return format(d, 'MMMM yyyy')
  }

  return (
    <div className="month-selector">
      <button className="month-nav-button" onClick={handlePrevMonth}>
        ←
      </button>
      <div className="month-display">
        <span className="month-text">{formatMonthYear(currentDate)}</span>
        <button className="today-button" onClick={handleToday}>
          {t('common.today')}
        </button>
      </div>
      <button className="month-nav-button" onClick={handleNextMonth}>
        →
      </button>
    </div>
  )
}

export default MonthSelector

