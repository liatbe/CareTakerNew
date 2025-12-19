import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getFamilyUsers, addFamilyUser, deleteFamilyUser, isAdmin } from '../utils/auth'
import { useNavigate } from 'react-router-dom'
import './UserManagement.css'

const UserManagement = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('caretaker')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/')
      return
    }
    loadUsers()
  }, [navigate])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const familyUsers = await getFamilyUsers()
      setUsers(familyUsers)
    } catch (error) {
      console.error('Error loading users:', error)
      setError(t('userManagement.loadError', 'Failed to load users'))
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!newUsername || !newPassword) {
      setError(t('userManagement.allFieldsRequired', 'All fields are required'))
      return
    }

    if (newPassword.length < 4) {
      setError(t('userManagement.passwordTooShort', 'Password must be at least 4 characters'))
      return
    }

    try {
      const result = await addFamilyUser(newUsername, newPassword, newUsername, newRole)
      if (result.success) {
        setSuccess(t('userManagement.userAdded', 'User added successfully'))
        setNewUsername('')
        setNewPassword('')
        setNewRole('caretaker')
        setShowAddForm(false)
        loadUsers()
      } else {
        setError(result.error || t('userManagement.addError', 'Failed to add user'))
      }
    } catch (error) {
      console.error('Error adding user:', error)
      setError(t('userManagement.addError', 'Failed to add user'))
    }
  }

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(t('userManagement.confirmDelete', `Are you sure you want to delete user "${username}"?`))) {
      return
    }

    try {
      const result = await deleteFamilyUser(userId)
      if (result.success) {
        setSuccess(t('userManagement.userDeleted', 'User deleted successfully'))
        loadUsers()
      } else {
        setError(result.error || t('userManagement.deleteError', 'Failed to delete user'))
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      setError(t('userManagement.deleteError', 'Failed to delete user'))
    }
  }

  if (loading) {
    return (
      <div className="user-management">
        <div className="loading">{t('common.loading', 'Loading...')}</div>
      </div>
    )
  }

  return (
    <div className="user-management">
      <h1 className="page-title">{t('userManagement.title', 'User Management')}</h1>
      <p className="page-subtitle">{t('userManagement.subtitle', 'Manage users for your family')}</p>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="content-card">
        <div className="card-header">
          <h2>{t('userManagement.familyUsers', 'Family Users')}</h2>
          <button 
            className="add-user-button" 
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? t('common.cancel') : t('userManagement.addUser', 'Add User')}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddUser} className="add-user-form">
            <div className="form-group">
              <label>{t('login.username', 'Username')}</label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>{t('login.password', 'Password')}</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>{t('userManagement.role', 'Role')}</label>
              <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                <option value="admin">{t('userManagement.roleAdmin', 'Admin')}</option>
                <option value="caretaker">{t('userManagement.roleCaretaker', 'Caretaker')}</option>
              </select>
            </div>
            <button type="submit" className="submit-button">
              {t('userManagement.addUser', 'Add User')}
            </button>
          </form>
        )}

        <div className="users-list">
          {users.length === 0 ? (
            <div className="empty-state">
              <p>{t('userManagement.noUsers', 'No users found')}</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>{t('login.username', 'Username')}</th>
                  <th>{t('userManagement.role', 'Role')}</th>
                  <th>{t('common.delete', 'Delete')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id || user.username}>
                    <td>{user.username}</td>
                    <td>
                      <span className={`role-badge role-${user.role || 'admin'}`}>
                        {user.role === 'caretaker' 
                          ? t('userManagement.roleCaretaker', 'Caretaker')
                          : t('userManagement.roleAdmin', 'Admin')}
                      </span>
                    </td>
                    <td>
                      <button
                        className="delete-button"
                        onClick={() => handleDeleteUser(user.id || user.username, user.username)}
                      >
                        {t('common.delete', 'Delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserManagement

