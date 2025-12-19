import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { logout, getUserRole, isAdmin } from '../utils/auth'
import LanguageSwitcher from './LanguageSwitcher'
import './Layout.css'

const Layout = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const userRole = getUserRole()
  const admin = isAdmin()

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
    { path: '/user-management', label: t('navigation.userManagement'), adminOnly: true }
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
          <h1 className="header-title">{t('login.title')}</h1>
          <div className="header-actions">
            <LanguageSwitcher />
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

