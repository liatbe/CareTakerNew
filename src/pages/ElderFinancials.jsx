import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import MonthSelector from '../components/MonthSelector'
import { storage } from '../utils/storage'
import { getMonthKey, getCurrentMonthKey } from '../utils/dateUtils'
import { exportToExcel } from '../utils/excelExport'
import './ElderFinancials.css'

const ElderFinancials = () => {
  const { t } = useTranslation()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [entries, setEntries] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [newEntry, setNewEntry] = useState({ name: '', amount: '' })

  const currentMonthKey = getMonthKey(selectedDate)

  useEffect(() => {
    loadEntries()
  }, [currentMonthKey])

  const loadEntries = () => {
    const data = storage.get('elderFinancials', {})
    const monthData = data[currentMonthKey] || []
    
    // If no data for this month, try to copy from previous month
    if (monthData.length === 0 && Object.keys(data).length > 0) {
      const sortedKeys = Object.keys(data).sort().reverse()
      for (const key of sortedKeys) {
        if (key < currentMonthKey && data[key].length > 0) {
          setEntries([...data[key]])
          return
        }
      }
    }
    
    setEntries(monthData)
  }

  const saveEntries = (newEntries) => {
    const data = storage.get('elderFinancials', {})
    data[currentMonthKey] = newEntries
    storage.set('elderFinancials', data)
    setEntries(newEntries)
  }

  const handleAdd = () => {
    if (!newEntry.name || !newEntry.amount) return
    
    const entry = {
      id: Date.now(),
      name: newEntry.name,
      amount: parseFloat(newEntry.amount) || 0
    }
    
    const updated = [...entries, entry]
    saveEntries(updated)
    setNewEntry({ name: '', amount: '' })
  }

  const handleEdit = (id) => {
    setEditingId(id)
  }

  const handleSaveEdit = (id, name, amount) => {
    const updated = entries.map(e => 
      e.id === id ? { ...e, name, amount: parseFloat(amount) || 0 } : e
    )
    saveEntries(updated)
    setEditingId(null)
  }

  const handleDelete = (id) => {
    if (window.confirm(t('common.confirmDelete', 'Are you sure you want to delete this entry?'))) {
      const updated = entries.filter(e => e.id !== id)
      saveEntries(updated)
    }
  }

  const handleExport = () => {
    const exportData = entries.map(e => ({
      [t('elderFinancials.entryName')]: e.name,
      [t('common.amount')]: e.amount,
      [t('common.currency')]: '₪'
    }))
    
    if (exportData.length === 0) {
      exportData.push({
        [t('elderFinancials.entryName')]: '',
        [t('common.amount')]: 0,
        [t('common.currency')]: '₪'
      })
    }
    
    exportToExcel(exportData, `elder-financials-${currentMonthKey}`)
  }

  const total = entries.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="elder-financials">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('elderFinancials.title')}</h1>
          <p className="page-subtitle">{t('elderFinancials.subtitle')}</p>
        </div>
        <div className="page-header-actions">
          <MonthSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </div>
      </div>
      
      <div className="content-card card">
        <div className="card-header">
          <div>
            <h2 className="card-title">{t('elderFinancials.title')} {currentMonthKey}</h2>
          </div>
          <div className="card-actions">
            <button className="btn btn-primary" onClick={handleAdd}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor"/>
              </svg>
              {t('elderFinancials.addEntry')}
            </button>
            <button className="btn btn-success" onClick={handleExport}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 9H15V3H9V9H5L12 16L19 9ZM5 18V20H19V18H5Z" fill="currentColor"/>
              </svg>
              {t('common.export')}
            </button>
          </div>
        </div>
        
        <div className="entries-table">
          <table className="table">
            <thead>
              <tr>
                <th>{t('elderFinancials.entryName')}</th>
                <th>{t('common.amount')} (₪)</th>
                <th>{t('common.edit')}</th>
                <th>{t('common.delete')}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <tr key={entry.id}>
                  <td>
                    {editingId === entry.id ? (
                      <input
                        type="text"
                        defaultValue={entry.name}
                        onBlur={(e) => handleSaveEdit(entry.id, e.target.value, entry.amount)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEdit(entry.id, e.target.value, entry.amount)
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      entry.name
                    )}
                  </td>
                  <td>
                    {editingId === entry.id ? (
                      <input
                        type="number"
                        defaultValue={entry.amount}
                        onBlur={(e) => handleSaveEdit(entry.id, entry.name, e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEdit(entry.id, entry.name, e.target.value)
                          }
                        }}
                        step="0.01"
                      />
                    ) : (
                      entry.amount.toFixed(2)
                    )}
                  </td>
                  <td>
                    <button
                      className="edit-button"
                      onClick={() => editingId === entry.id ? setEditingId(null) : handleEdit(entry.id)}
                    >
                      {t('common.edit')}
                    </button>
                  </td>
                  <td>
                    <button
                      className="delete-button"
                      onClick={() => handleDelete(entry.id)}
                    >
                      {t('common.delete')}
                    </button>
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan="4" className="empty-message">
                    {t('common.noEntries', 'No entries yet')}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td><strong>{t('elderFinancials.monthlyTotal')}</strong></td>
                <td><strong className="summary-value">{total.toFixed(2)} ₪</strong></td>
                <td colSpan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ElderFinancials

