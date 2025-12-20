import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { logout, getUserRole, isAdmin, getCurrentUser } from '../utils/auth'
import { storage } from '../utils/storage'
import LanguageSwitcher from './LanguageSwitcher'
import './Layout.css'
import '../styles/enhanced-styles.css'

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

  // Navigation icons
  const getNavIcon = (path) => {
    const icons = {
      '/': (
        <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" fill="currentColor"/>
        </svg>
      ),
      '/elder-financials': (
        <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.8 10.9C9.53 10.31 8.8 9.7 8.8 8.75C8.8 7.66 9.81 6.9 11.5 6.9C13.28 6.9 13.94 7.75 14 9H16.21C16.14 7.28 15.09 5.7 13 5.19V3H10V5.16C8.06 5.58 6.5 6.84 6.5 8.77C6.5 11.08 8.41 12.23 11.2 12.9C13.7 13.5 14.2 14.38 14.2 15.31C14.2 16 13.71 17.1 11.5 17.1C9.28 17.1 8.63 16.18 8.5 15H6.32C6.44 17.18 7.76 18.5 10 18.93V21H13V18.91C14.97 18.5 16.5 17.35 16.5 15.3C16.5 12.46 14.07 11.5 11.8 10.9Z" fill="currentColor"/>
        </svg>
      ),
      '/elder-expenses': (
        <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.8 10.9C9.53 10.31 8.8 9.7 8.8 8.75C8.8 7.66 9.81 6.9 11.5 6.9C13.28 6.9 13.94 7.75 14 9H16.21C16.14 7.28 15.09 5.7 13 5.19V3H10V5.16C8.06 5.58 6.5 6.84 6.5 8.77C6.5 11.08 8.41 12.23 11.2 12.9C13.7 13.5 14.2 14.38 14.2 15.31C14.2 16 13.71 17.1 11.5 17.1C9.28 17.1 8.63 16.18 8.5 15H6.32C6.44 17.18 7.76 18.5 10 18.93V21H13V18.91C14.97 18.5 16.5 17.35 16.5 15.3C16.5 12.46 14.07 11.5 11.8 10.9Z" fill="currentColor"/>
        </svg>
      ),
      '/shevah-coverage': (
        <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM16 18H8V16H16V18ZM16 14H8V12H16V14ZM13 9V3.5L18.5 9H13Z" fill="currentColor"/>
        </svg>
      ),
      '/caretaker-payslips': (
        <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6H16L14 4H10L8 6H4C2.9 6 2 6.9 2 8V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V8C22 6.9 21.1 6 20 6ZM20 19H4V8H20V19Z" fill="currentColor"/>
        </svg>
      ),
      '/caretaker-worklog': (
        <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 4H5C3.89 4 3 4.9 3 6V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4ZM19 20H5V9H19V20ZM7 11H9V13H7V11ZM11 11H13V13H11V11ZM15 11H17V13H15V11ZM7 15H9V17H7V15ZM11 15H13V17H11V15ZM15 15H17V17H15V15Z" fill="currentColor"/>
        </svg>
      ),
      '/settings': (
        <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19.14 12.94C19.18 12.64 19.2 12.33 19.2 12C19.2 11.67 19.18 11.36 19.14 11.06L21.16 9.37C21.34 9.22 21.38 8.95 21.23 8.73L19.26 5.77C19.11 5.55 18.85 5.5 18.63 5.65L16.34 7.16C15.8 6.79 15.2 6.5 14.55 6.32L14.2 3.89C14.17 3.66 13.98 3.5 13.75 3.5H10.25C10.02 3.5 9.83 3.66 9.8 3.89L9.45 6.32C8.8 6.5 8.2 6.79 7.66 7.16L5.37 5.65C5.15 5.5 4.89 5.55 4.74 5.77L2.77 8.73C2.62 8.95 2.66 9.22 2.84 9.37L4.86 11.06C4.82 11.36 4.8 11.67 4.8 12C4.8 12.33 4.82 12.64 4.86 12.94L2.84 14.63C2.66 14.78 2.62 15.05 2.77 15.27L4.74 18.23C4.89 18.45 5.15 18.5 5.37 18.35L7.66 16.84C8.2 17.21 8.8 17.5 9.45 17.68L9.8 20.11C9.83 20.34 10.02 20.5 10.25 20.5H13.75C13.98 20.5 14.17 20.34 14.2 20.11L14.55 17.68C15.2 17.5 15.8 17.21 16.34 16.84L18.63 18.35C18.85 18.5 19.11 18.45 19.26 18.23L21.23 15.27C21.38 15.05 21.34 14.78 21.16 14.63L19.14 12.94ZM12 15.5C10.07 15.5 8.5 13.93 8.5 12C8.5 10.07 10.07 8.5 12 8.5C13.93 8.5 15.5 10.07 15.5 12C15.5 13.93 13.93 15.5 12 15.5Z" fill="currentColor"/>
        </svg>
      ),
      '/user-management': (
        <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z" fill="currentColor"/>
        </svg>
      ),
      '/action-log': (
        <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM16 18H8V16H16V18ZM16 14H8V12H16V14ZM13 9V3.5L18.5 9H13Z" fill="currentColor"/>
        </svg>
      )
    }
    return icons[path] || null
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
            <svg className="header-title-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19Z" fill="currentColor"/>
              <path d="M7 7H17V9H7V7ZM7 11H17V13H7V11ZM7 15H13V17H7V15Z" fill="currentColor"/>
            </svg>
            <span className="header-title-text">
              <span className="header-title-main">{t('login.title')}</span>
              {familyName && <span className="header-title-subtitle">{familyName}</span>}
            </span>
          </h1>
          <div className="header-actions">
            <LanguageSwitcher />
            {currentUsername && (
              <div className="current-username-wrapper">
                <svg className="username-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span className="current-username">{currentUsername}</span>
              </div>
            )}
            <button className="logout-button" onClick={handleLogout}>
              <svg className="logout-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
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
              {getNavIcon(item.path)}
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

