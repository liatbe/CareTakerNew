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
      <h1 className="page-title">{t('elderFinancials.title')}</h1>
      <p className="page-subtitle">{t('elderFinancials.subtitle')}</p>
      
      <MonthSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
      
      <div className="content-card">
        <div className="card-header">
          <h2>{t('elderFinancials.title')}</h2>
          <button className="export-button" onClick={handleExport}>
            {t('common.export')}
          </button>
        </div>
        
        <div className="add-entry-form">
          <input
            type="text"
            placeholder={t('elderFinancials.entryName')}
            value={newEntry.name}
            onChange={(e) => setNewEntry({ ...newEntry, name: e.target.value })}
          />
          <input
            type="number"
            placeholder={t('common.amount')}
            value={newEntry.amount}
            onChange={(e) => setNewEntry({ ...newEntry, amount: e.target.value })}
            step="0.01"
          />
          <button className="add-button" onClick={handleAdd}>
            {t('common.add')}
          </button>
        </div>
        
        <div className="entries-table">
          <table>
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
                <td><strong>{total.toFixed(2)} ₪</strong></td>
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

