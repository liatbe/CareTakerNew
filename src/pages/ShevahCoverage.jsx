import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import MonthSelector from '../components/MonthSelector'
import { storage } from '../utils/storage'
import { getMonthKey } from '../utils/dateUtils'
import './ShevahCoverage.css'

const ShevahCoverage = () => {
  const { t } = useTranslation()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [rows, setRows] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editingValues, setEditingValues] = useState({ hours: '', amountPerHour: '' })

  const currentMonthKey = getMonthKey(selectedDate)

  useEffect(() => {
    // Check if Shevah entry exists in expenses
    const expenses = storage.get('elderExpenses', {})
    const monthExpenses = expenses[currentMonthKey] || []
    const hasShevah = monthExpenses.some(e => e.name.toLowerCase().includes('shevah') || e.name.toLowerCase().includes('שבח'))
    
    if (!hasShevah) {
      // Check previous months
      const sortedKeys = Object.keys(expenses).sort().reverse()
      for (const key of sortedKeys) {
        if (key < currentMonthKey) {
          const prevExpenses = expenses[key] || []
          if (prevExpenses.some(e => e.name.toLowerCase().includes('shevah') || e.name.toLowerCase().includes('שבח'))) {
            break
          }
        }
      }
    }

    loadRows()
  }, [currentMonthKey])

  const loadRows = () => {
    const data = storage.get('shevahCoverage', {})
    const monthData = data[currentMonthKey] || []
    setRows(monthData)
  }

  const saveRows = async (newRows) => {
    const data = storage.get('shevahCoverage', {})
    data[currentMonthKey] = newRows
    // Use setToBackend to ensure data persists to backend
    await storage.setToBackend('shevahCoverage', data)
    setRows(newRows)
  }

  const handleAddRow = () => {
    const newRow = {
      id: Date.now(),
      hours: 0,
      amountPerHour: 0
    }
    saveRows([...rows, newRow])
    // Automatically start editing the new row
    setEditingId(newRow.id)
    setEditingValues({ hours: '0', amountPerHour: '0' })
  }

  const handleSaveEdit = (id) => {
    // Use current editing values from state
    const hoursValue = parseFloat(editingValues.hours) || 0
    const amountValue = parseFloat(editingValues.amountPerHour) || 0
    const updated = rows.map(r => 
      r.id === id ? { ...r, hours: hoursValue, amountPerHour: amountValue } : r
    )
    saveRows(updated)
    setEditingId(null)
    setEditingValues({ hours: '', amountPerHour: '' })
  }

  const handleStartEdit = (row) => {
    setEditingId(row.id)
    setEditingValues({ hours: row.hours.toString(), amountPerHour: row.amountPerHour.toString() })
  }

  const handleDelete = (id) => {
    if (window.confirm(t('common.confirmDelete', 'Are you sure you want to delete this row?'))) {
      const updated = rows.filter(r => r.id !== id)
      saveRows(updated)
    }
  }

  const totalMonetaryAmount = rows.reduce((sum, r) => sum + (r.hours * r.amountPerHour), 0)
  const pension = totalMonetaryAmount * 0.065
  const firingPayment = totalMonetaryAmount * 0.0833

  return (
    <div className="shevah-coverage">
      <h1 className="page-title">{t('shevahCoverage.title')}</h1>
      <p className="page-subtitle">{t('shevahCoverage.subtitle')}</p>
      
      <MonthSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
      
      <div className="content-card">
        <div className="card-header">
          <h2>{t('shevahCoverage.title')}</h2>
          <button className="add-row-button" onClick={handleAddRow}>
            {t('shevahCoverage.addRow')}
          </button>
        </div>
        
        {rows.length === 0 ? (
          <div className="empty-state">
            <p>{t('shevahCoverage.noEntries', 'No entries for this month. Click "Add Row" to add an entry.')}</p>
          </div>
        ) : (
          <div className="rows-table">
            <table>
              <thead>
                <tr>
                  <th>{t('shevahCoverage.hours')}</th>
                  <th>{t('shevahCoverage.amountPerHour')} (₪)</th>
                  <th>{t('shevahCoverage.rowTotal')} (₪)</th>
                  <th>{t('common.edit')}</th>
                  <th>{t('common.delete')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => {
                  // Use editing values if this row is being edited, otherwise use row values
                  const currentHours = editingId === row.id ? (parseFloat(editingValues.hours) || 0) : row.hours
                  const currentAmount = editingId === row.id ? (parseFloat(editingValues.amountPerHour) || 0) : row.amountPerHour
                  const rowTotal = currentHours * currentAmount
                  return (
                    <tr key={row.id}>
                      <td>
                        {editingId === row.id ? (
                          <input
                            type="number"
                            value={editingValues.hours}
                            onChange={(e) => {
                              const newValue = e.target.value
                              setEditingValues(prev => ({ ...prev, hours: newValue }))
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === 'Tab') {
                                e.preventDefault()
                                // Focus on amountPerHour field
                                const amountInput = e.target.closest('tr').querySelector('input[type="number"]:last-of-type')
                                if (amountInput) {
                                  amountInput.focus()
                                  amountInput.select()
                                }
                              }
                            }}
                            step="0.1"
                            autoFocus
                          />
                        ) : (
                          row.hours.toFixed(1)
                        )}
                      </td>
                      <td>
                        {editingId === row.id ? (
                          <input
                            type="number"
                            value={editingValues.amountPerHour}
                            onChange={(e) => {
                              const newValue = e.target.value
                              setEditingValues(prev => ({ ...prev, amountPerHour: newValue }))
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleSaveEdit(row.id)
                              }
                            }}
                            step="0.01"
                          />
                        ) : (
                          row.amountPerHour.toFixed(2)
                        )}
                      </td>
                      <td>
                        <strong>{rowTotal.toFixed(2)}</strong>
                      </td>
                      <td>
                        <button
                          className="edit-button"
                          onClick={() => {
                            if (editingId === row.id) {
                              handleSaveEdit(row.id)
                            } else {
                              handleStartEdit(row)
                            }
                          }}
                        >
                          {editingId === row.id ? t('common.save') : t('common.edit')}
                        </button>
                      </td>
                      <td>
                        <button
                          className="delete-button"
                          onClick={() => handleDelete(row.id)}
                        >
                          {t('common.delete')}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="calculations">
          <div className="calculation-row">
            <div className="calculation-label">{t('shevahCoverage.totalMonetaryAmount')}</div>
            <div className="calculation-value">{totalMonetaryAmount.toFixed(2)} ₪</div>
          </div>
          <div className="calculation-row">
            <div className="calculation-label">{t('shevahCoverage.pension')}</div>
            <div className="calculation-value">{pension.toFixed(2)} ₪</div>
          </div>
          <div className="calculation-row">
            <div className="calculation-label">{t('shevahCoverage.firingPayment')}</div>
            <div className="calculation-value">{firingPayment.toFixed(2)} ₪</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShevahCoverage

