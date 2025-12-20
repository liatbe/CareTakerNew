import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { logout, getUserRole, isAdmin, getCurrentUser } from '../utils/auth'
import { storage } from '../utils/storage'
import LanguageSwitcher from './LanguageSwitcher'
import './Layout.css'

const Layout = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const userRole = getUserRole()
  const admin = isAdmin()
  const [familyName, setFamilyName] = useState('')
  const [currentUsername, setCurrentUsername] = useState('')

  useEffect(() => {
    // Load family name from storage
    // Reload on location change to catch updates after registration
    const loadFamilyName = () => {
      const name = storage.get('familyName', '')
      if (name) {
        setFamilyName(name)
      }
    }
    
    // Load current username
    const loadCurrentUsername = () => {
      const user = getCurrentUser()
      if (user && user.username) {
        setCurrentUsername(user.username)
      }
    }
    
    // Load immediately
    loadFamilyName()
    loadCurrentUsername()
    
    // Also check after a short delay in case it was just saved
    const timeoutId = setTimeout(() => {
      loadFamilyName()
      loadCurrentUsername()
    }, 100)
    
    return () => clearTimeout(timeoutId)
  }, [location])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // All available navigation items
  const allNavItems = [
    { path: '/', label: t('navigation.dashboard'), adminOnly: true },
    { path: '/caretaker-payslips', label: t('navigation.caretakerPayslips'), adminOnly: false },
    { path: '/caretaker-worklog', label: t('navigation.caretakerWorklog'), adminOnly: false },
    { path: '/elder-financials', label: t('navigation.elderFinancials'), adminOnly: true },
    { path: '/elder-expenses', label: t('navigation.elderExpenses'), adminOnly: true },
    { path: '/shevah-coverage', label: t('navigation.shevahCoverage'), adminOnly: true },
    { path: '/settings', label: t('navigation.settings'), adminOnly: true },
    { path: '/user-management', label: t('navigation.userManagement'), adminOnly: true },
    { path: '/action-log', label: t('navigation.actionLog'), adminOnly: true }
  ]

  // Filter navigation items based on user role
  const navItems = allNavItems.filter(item => {
    if (item.adminOnly) {
      return admin // Only show admin-only items to admins
    }
    return true // Show all non-admin-only items to everyone
  })

  return (
    <div className="layout">
      <header className="layout-header">
        <div className="header-content">
          <h1 className="header-title">
            {familyName ? `${familyName} - ${t('login.title')}` : t('login.title')}
          </h1>
          <div className="header-actions">
            <LanguageSwitcher />
            {currentUsername && (
              <span className="current-username">{currentUsername}</span>
            )}
            <button className="logout-button" onClick={handleLogout}>
              {t('navigation.logout')}
            </button>
          </div>
        </div>
      </header>
      <nav className="layout-nav">
        <div className="nav-container">
          {navItems.map(item => (
            <button
              key={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>
      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout

