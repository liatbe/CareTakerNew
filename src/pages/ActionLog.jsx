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
  const [filterRole, setFilterRole] = useState('caretaker') // Default to caretaker actions
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/')
      return
    }
    loadActions()
  }, [navigate, filterRole])

  const loadActions = () => {
    setLoading(true)
    const log = getActionLog(filterRole || null)
    setActions(log)
    setLoading(false)
  }

  const formatDateTime = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleString()
  }

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
      <h1 className="page-title">{t('actionLog.title', 'Action Log')}</h1>
      <p className="page-subtitle">{t('actionLog.subtitle', 'View actions performed by users')}</p>

      <div className="content-card">
        <div className="card-header">
          <h2>{t('actionLog.familyActions', 'Family Actions')}</h2>
          <div className="filter-controls">
            <label>{t('actionLog.filterByRole', 'Filter by role')}:</label>
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
              <option value="">{t('actionLog.allRoles', 'All Roles')}</option>
              <option value="admin">{t('userManagement.roleAdmin', 'Admin')}</option>
              <option value="caretaker">{t('userManagement.roleCaretaker', 'Caretaker')}</option>
            </select>
          </div>
        </div>

        {actions.length === 0 ? (
          <div className="empty-state">
            <p>{t('actionLog.noActions', 'No actions found')}</p>
          </div>
        ) : (
          <div className="actions-list">
            <table>
              <thead>
                <tr>
                  <th>{t('actionLog.dateTime', 'Date & Time')}</th>
                  <th>{t('login.username', 'Username')}</th>
                  <th>{t('userManagement.role', 'Role')}</th>
                  <th>{t('actionLog.action', 'Action')}</th>
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

