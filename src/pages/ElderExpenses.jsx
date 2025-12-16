import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import MonthSelector from '../components/MonthSelector'
import { storage } from '../utils/storage'
import { getMonthKey } from '../utils/dateUtils'
import { exportToExcel } from '../utils/excelExport'
import './ElderExpenses.css'

const ElderExpenses = () => {
  const { t } = useTranslation()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [entries, setEntries] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [newEntry, setNewEntry] = useState({ name: '', type: 'amount', amount: '', hours: '' })

  const currentMonthKey = getMonthKey(selectedDate)

  useEffect(() => {
    loadEntries()
  }, [currentMonthKey])

  const loadEntries = () => {
    const data = storage.get('elderExpenses', {})
    const monthData = data[currentMonthKey] || []
    
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
    const data = storage.get('elderExpenses', {})
    data[currentMonthKey] = newEntries
    storage.set('elderExpenses', data)
    setEntries(newEntries)
  }

  const handleAdd = () => {
    if (!newEntry.name) return
    
    const entry = {
      id: Date.now(),
      name: newEntry.name,
      type: newEntry.type,
      amount: newEntry.type === 'amount' ? (parseFloat(newEntry.amount) || 0) : null,
      hours: newEntry.type === 'hours' ? (parseFloat(newEntry.hours) || 0) : null
    }
    
    const updated = [...entries, entry]
    saveEntries(updated)
    setNewEntry({ name: '', type: 'amount', amount: '', hours: '' })
  }

  const handleSaveEdit = (id, name, type, amount, hours) => {
    const updated = entries.map(e => 
      e.id === id ? {
        ...e,
        name,
        type,
        amount: type === 'amount' ? (parseFloat(amount) || 0) : null,
        hours: type === 'hours' ? (parseFloat(hours) || 0) : null
      } : e
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
      [t('elderExpenses.entryName')]: e.name,
      [t('elderExpenses.type')]: e.type === 'amount' ? t('elderExpenses.typeAmount') : t('elderExpenses.typeHours'),
      [t('common.amount')]: e.amount || 0,
      [t('common.hours')]: e.hours || 0
    }))
    
    if (exportData.length === 0) {
      exportData.push({
        [t('elderExpenses.entryName')]: '',
        [t('elderExpenses.type')]: '',
        [t('common.amount')]: 0,
        [t('common.hours')]: 0
      })
    }
    
    exportToExcel(exportData, `elder-expenses-${currentMonthKey}`)
  }

  const totalAmount = entries.reduce((sum, e) => sum + (e.amount || 0), 0)
  const totalHours = entries.reduce((sum, e) => sum + (e.hours || 0), 0)

  // Calculate bottom line (finances - expenses)
  const elderFinancials = storage.get('elderFinancials', {})
  const financialsMonth = elderFinancials[currentMonthKey] || []
  const totalFinancials = financialsMonth.reduce((sum, e) => sum + e.amount, 0)
  const bottomLine = totalFinancials - totalAmount

  return (
    <div className="elder-expenses">
      <h1 className="page-title">{t('elderExpenses.title')}</h1>
      <p className="page-subtitle">{t('elderExpenses.subtitle')}</p>
      
      <MonthSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
      
      <div className="content-card">
        <div className="card-header">
          <h2>{t('elderExpenses.title')}</h2>
          <button className="export-button" onClick={handleExport}>
            {t('common.export')}
          </button>
        </div>
        
        <div className="add-entry-form">
          <input
            type="text"
            placeholder={t('elderExpenses.entryName')}
            value={newEntry.name}
            onChange={(e) => setNewEntry({ ...newEntry, name: e.target.value })}
          />
          <select
            value={newEntry.type}
            onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value, amount: '', hours: '' })}
          >
            <option value="amount">{t('elderExpenses.typeAmount')}</option>
            <option value="hours">{t('elderExpenses.typeHours')}</option>
          </select>
          {newEntry.type === 'amount' ? (
            <input
              type="number"
              placeholder={t('common.amount')}
              value={newEntry.amount}
              onChange={(e) => setNewEntry({ ...newEntry, amount: e.target.value })}
              step="0.01"
            />
          ) : (
            <input
              type="number"
              placeholder={t('common.hours')}
              value={newEntry.hours}
              onChange={(e) => setNewEntry({ ...newEntry, hours: e.target.value })}
              step="0.1"
            />
          )}
          <button className="add-button" onClick={handleAdd}>
            {t('common.add')}
          </button>
        </div>
        
        <div className="entries-table">
          <table>
            <thead>
              <tr>
                <th>{t('elderExpenses.entryName')}</th>
                <th>{t('elderExpenses.type')}</th>
                <th>{t('common.amount')} (₪)</th>
                <th>{t('common.hours')}</th>
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
                        onBlur={(e) => handleSaveEdit(entry.id, e.target.value, entry.type, entry.amount, entry.hours)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEdit(entry.id, e.target.value, entry.type, entry.amount, entry.hours)
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
                      <select
                        defaultValue={entry.type}
                        onChange={(e) => {
                          const newType = e.target.value
                          handleSaveEdit(entry.id, entry.name, newType, newType === 'amount' ? entry.amount : 0, newType === 'hours' ? entry.hours : 0)
                        }}
                      >
                        <option value="amount">{t('elderExpenses.typeAmount')}</option>
                        <option value="hours">{t('elderExpenses.typeHours')}</option>
                      </select>
                    ) : (
                      entry.type === 'amount' ? t('elderExpenses.typeAmount') : t('elderExpenses.typeHours')
                    )}
                  </td>
                  <td>
                    {editingId === entry.id ? (
                      <input
                        type="number"
                        defaultValue={entry.amount || ''}
                        onBlur={(e) => handleSaveEdit(entry.id, entry.name, entry.type, e.target.value, entry.hours)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEdit(entry.id, entry.name, entry.type, e.target.value, entry.hours)
                          }
                        }}
                        step="0.01"
                        disabled={entry.type === 'hours'}
                      />
                    ) : (
                      entry.amount !== null ? entry.amount.toFixed(2) : '-'
                    )}
                  </td>
                  <td>
                    {editingId === entry.id ? (
                      <input
                        type="number"
                        defaultValue={entry.hours || ''}
                        onBlur={(e) => handleSaveEdit(entry.id, entry.name, entry.type, entry.amount, e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEdit(entry.id, entry.name, entry.type, entry.amount, e.target.value)
                          }
                        }}
                        step="0.1"
                        disabled={entry.type === 'amount'}
                      />
                    ) : (
                      entry.hours !== null ? entry.hours.toFixed(1) : '-'
                    )}
                  </td>
                  <td>
                    <button
                      className="edit-button"
                      onClick={() => editingId === entry.id ? setEditingId(null) : setEditingId(entry.id)}
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
                  <td colSpan="6" className="empty-message">
                    {t('common.noEntries', 'No entries yet')}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td><strong>{t('elderExpenses.monthlyTotal')}</strong></td>
                <td></td>
                <td><strong>{totalAmount.toFixed(2)} ₪</strong></td>
                <td><strong>{totalHours.toFixed(1)}</strong></td>
                <td colSpan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <div className={`bottom-line ${bottomLine >= 0 ? 'positive' : 'negative'}`}>
          <div className="bottom-line-label">{t('elderExpenses.bottomLine')}</div>
          <div className="bottom-line-amount">
            {bottomLine >= 0 ? '+' : ''}{bottomLine.toFixed(2)} ₪
          </div>
          <div className="bottom-line-status">
            {bottomLine >= 0 ? t('elderExpenses.positive') : t('elderExpenses.negative')}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ElderExpenses

