import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { logout } from '../utils/auth'
import LanguageSwitcher from './LanguageSwitcher'
import './Layout.css'

const Layout = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { path: '/', label: t('navigation.dashboard') },
    { path: '/caretaker-payslips', label: t('navigation.caretakerPayslips') },
    { path: '/caretaker-worklog', label: t('navigation.caretakerWorklog') },
    { path: '/elder-financials', label: t('navigation.elderFinancials') },
    { path: '/elder-expenses', label: t('navigation.elderExpenses') },
    { path: '/shevah-coverage', label: t('navigation.shevahCoverage') },
    { path: '/settings', label: t('navigation.settings') }
  ]

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

