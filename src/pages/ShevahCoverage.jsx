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
    
    if (monthData.length === 0) {
      // Default row
      setRows([{ id: Date.now(), hours: 12.5, amountPerHour: 44 }])
    } else {
      setRows(monthData)
    }
  }

  const saveRows = (newRows) => {
    const data = storage.get('shevahCoverage', {})
    data[currentMonthKey] = newRows
    storage.set('shevahCoverage', data)
    setRows(newRows)
  }

  const handleAddRow = () => {
    const newRow = {
      id: Date.now(),
      hours: 12.5,
      amountPerHour: 44
    }
    saveRows([...rows, newRow])
  }

  const handleSaveEdit = (id, hours, amountPerHour) => {
    const updated = rows.map(r => 
      r.id === id ? { ...r, hours: parseFloat(hours) || 0, amountPerHour: parseFloat(amountPerHour) || 0 } : r
    )
    saveRows(updated)
    setEditingId(null)
  }

  const handleDelete = (id) => {
    if (rows.length === 1) {
      alert(t('common.cannotDeleteLast', 'Cannot delete the last row'))
      return
    }
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
                const rowTotal = row.hours * row.amountPerHour
                return (
                  <tr key={row.id}>
                    <td>
                      {editingId === row.id ? (
                        <input
                          type="number"
                          defaultValue={row.hours}
                          onBlur={(e) => handleSaveEdit(row.id, e.target.value, row.amountPerHour)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveEdit(row.id, e.target.value, row.amountPerHour)
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
                          defaultValue={row.amountPerHour}
                          onBlur={(e) => handleSaveEdit(row.id, row.hours, e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveEdit(row.id, row.hours, e.target.value)
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
                        onClick={() => editingId === row.id ? setEditingId(null) : setEditingId(row.id)}
                      >
                        {t('common.edit')}
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

