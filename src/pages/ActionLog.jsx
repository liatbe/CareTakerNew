import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { isAdmin } from '../utils/auth'
import { getActionLog } from '../utils/actionLogger'
import { useNavigate } from 'react-router-dom'
import './ActionLog.css'

const ActionLog = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [actions, setActions] = useState([])
  const [filterRole, setFilterRole] = useState('') // Default to All Roles
  const [sortField, setSortField] = useState('timestamp') // Default sort by timestamp
  const [sortDirection, setSortDirection] = useState('desc') // Default: newest first (descending)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/')
      return
    }
    loadActions()
  }, [navigate, filterRole])

  const getActionLabel = (action) => {
    switch (action) {
      case 'add_activity':
        return t('actionLog.addActivity', 'Added activity')
      case 'delete_activity':
        return t('actionLog.deleteActivity', 'Deleted activity')
      default:
        return action
    }
  }

  useEffect(() => {
    // Re-sort actions when sort field or direction changes
    if (actions.length > 0) {
      sortActions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortField, sortDirection])

  const sortActions = () => {
    setActions(prevActions => {
      const sorted = [...prevActions].sort((a, b) => {
        let aValue, bValue

        switch (sortField) {
          case 'timestamp':
            aValue = new Date(a.timestamp).getTime()
            bValue = new Date(b.timestamp).getTime()
            break
          case 'username':
            aValue = (a.username || '').toLowerCase()
            bValue = (b.username || '').toLowerCase()
            break
          case 'role':
            aValue = (a.role || 'admin').toLowerCase()
            bValue = (b.role || 'admin').toLowerCase()
            break
          case 'action':
            aValue = getActionLabel(a.action).toLowerCase()
            bValue = getActionLabel(b.action).toLowerCase()
            break
          default:
            aValue = a[sortField] || ''
            bValue = b[sortField] || ''
        }

        if (aValue < bValue) {
          return sortDirection === 'asc' ? -1 : 1
        }
        if (aValue > bValue) {
          return sortDirection === 'asc' ? 1 : -1
        }
        return 0
      })
      return sorted
    })
  }

  const loadActions = () => {
    setLoading(true)
    const log = getActionLog(filterRole || null)
    // Sort the loaded actions by timestamp (newest first by default)
    const sorted = log.sort((a, b) => {
      const aTime = new Date(a.timestamp).getTime()
      const bTime = new Date(b.timestamp).getTime()
      return sortDirection === 'desc' ? bTime - aTime : aTime - bTime
    })
    setActions(sorted)
    setLoading(false)
  }

  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // New field, default to descending (newest first)
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return '↕️' // Neutral icon when not sorted
    }
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  const formatDateTime = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleString()
  }

  const getActivityTypeLabel = (type) => {
    return t(`caretakerWorklog.${type}`, type)
  }

  if (loading) {
    return (
      <div className="action-log">
        <div className="loading">{t('common.loading', 'Loading...')}</div>
      </div>
    )
  }

  return (
    <div className="action-log">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('actionLog.title', 'Action Log')}</h1>
          <p className="page-subtitle">{t('actionLog.subtitle', 'View actions performed by users')}</p>
        </div>
      </div>

      <div className="content-card card">
        <div className="card-header">
          <div>
            <h2 className="card-title">{t('actionLog.familyActions', 'Family Actions')}</h2>
          </div>
          <div className="card-actions">
            <div className="filter-controls">
              <label>{t('actionLog.filterByRole', 'Filter by role')}:</label>
              <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                <option value="">{t('actionLog.allRoles', 'All Roles')}</option>
                <option value="admin">{t('userManagement.roleAdmin', 'Admin')}</option>
                <option value="caretaker">{t('userManagement.roleCaretaker', 'Caretaker')}</option>
              </select>
            </div>
          </div>
        </div>

        {actions.length === 0 ? (
          <div className="empty-state">
            <p>{t('actionLog.noActions', 'No actions found')}</p>
          </div>
        ) : (
          <div className="actions-list">
            <table className="table">
              <thead>
                <tr>
                  <th 
                    className="sortable-header" 
                    onClick={() => handleSort('timestamp')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    {t('actionLog.dateTime', 'Date & Time')} {getSortIcon('timestamp')}
                  </th>
                  <th 
                    className="sortable-header" 
                    onClick={() => handleSort('username')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    {t('login.username', 'Username')} {getSortIcon('username')}
                  </th>
                  <th 
                    className="sortable-header" 
                    onClick={() => handleSort('role')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    {t('userManagement.role', 'Role')} {getSortIcon('role')}
                  </th>
                  <th 
                    className="sortable-header" 
                    onClick={() => handleSort('action')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    {t('actionLog.action', 'Action')} {getSortIcon('action')}
                  </th>
                  <th>{t('actionLog.details', 'Details')}</th>
                </tr>
              </thead>
              <tbody>
                {actions.map(action => (
                  <tr key={action.id}>
                    <td>{formatDateTime(action.timestamp)}</td>
                    <td>{action.username}</td>
                    <td>
                      <span className={`role-badge role-${action.role || 'admin'}`}>
                        {action.role === 'caretaker' 
                          ? t('userManagement.roleCaretaker', 'Caretaker')
                          : t('userManagement.roleAdmin', 'Admin')}
                      </span>
                    </td>
                    <td>{getActionLabel(action.action)}</td>
                    <td>
                      {action.action === 'add_activity' || action.action === 'delete_activity' ? (
                        <span>
                          {getActivityTypeLabel(action.details?.activityType)} - {action.details?.date}
                        </span>
                      ) : (
                        <span>{JSON.stringify(action.details)}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default ActionLog

