import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { format, parseISO, startOfMonth, getYear, getMonth } from 'date-fns'
import './MonthSelector.css'

const MonthSelector = ({ selectedDate, onDateChange }) => {
  const { t, i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date())
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (selectedDate) {
      setCurrentDate(selectedDate)
    }
  }, [selectedDate])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const formatMonthYear = (date) => {
    const d = typeof date === 'string' ? parseISO(date) : date
    if (i18n.language === 'he') {
      // Hebrew month names
      const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']
      return `${months[d.getMonth()]} ${d.getFullYear()}`
    }
    return format(d, 'MMMM yyyy')
  }

  const handleMonthSelect = (year, month) => {
    const newDate = new Date(year, month, 1)
    setCurrentDate(newDate)
    onDateChange(newDate)
    setIsOpen(false)
  }

  // Generate list of months/years to show (current year and previous/next year)
  const currentYear = getYear(currentDate)
  const currentMonth = getMonth(currentDate)
  const years = [currentYear - 1, currentYear, currentYear + 1]
  
  const months = i18n.language === 'he' 
    ? ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  return (
    <div className="month-selector" ref={dropdownRef}>
      <button
        className="month-dropdown-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="month-display-text">{formatMonthYear(currentDate)}</span>
        <svg className={`month-dropdown-arrow ${isOpen ? 'open' : ''}`} width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 4.5L6 7.5L9 4.5" />
        </svg>
      </button>
      {isOpen && (
        <div className="month-dropdown-menu">
          {years.map(year => (
            <div key={year} className="month-dropdown-year-group">
              <div className="month-dropdown-year-header">{year}</div>
              <div className="month-dropdown-months">
                {months.map((monthName, monthIndex) => (
                  <button
                    key={`${year}-${monthIndex}`}
                    className={`month-dropdown-item ${year === currentYear && monthIndex === currentMonth ? 'active' : ''}`}
                    onClick={() => handleMonthSelect(year, monthIndex)}
                  >
                    {monthName}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MonthSelector

