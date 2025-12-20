import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { isAuthenticated } from './utils/auth'
import { initializeData, storage } from './utils/storage'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ElderFinancials from './pages/ElderFinancials'
import ElderExpenses from './pages/ElderExpenses'
import ShevahCoverage from './pages/ShevahCoverage'
import CaretakerPayslips from './pages/CaretakerPayslips'
import CaretakerWorklog from './pages/CaretakerWorklog'
import Settings from './pages/Settings'
import UserManagement from './pages/UserManagement'
import ActionLog from './pages/ActionLog'
import Layout from './components/Layout'
import ScrollToTop from './components/ScrollToTop'
import { isAdmin, getUserRole } from './utils/auth'
import './App.css'

const PrivateRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" replace />
}

const PrivateAdminRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  if (!isAdmin()) {
    // Redirect caretakers to worklog instead of dashboard
    return <Navigate to="/caretaker-worklog" replace />
  }
  return children
}

function App() {
  const { i18n } = useTranslation()

  useEffect(() => {
    // Set document direction based on language
    if (i18n.language === 'he') {
      document.body.setAttribute('dir', 'rtl')
    } else {
      document.body.setAttribute('dir', 'ltr')
    }
  }, [i18n.language])

  useEffect(() => {
    // Expose storage debugging functions globally
    if (typeof window !== 'undefined') {
      window.testStorage = () => {
        const result = storage.test()
        console.log('Storage Test Result:', result)
        if (!result.available) {
          alert(`Storage test failed: ${result.error}\n\nPlease check:\n1. Browser settings allow localStorage\n2. Not in private/incognito mode\n3. Storage quota not exceeded`)
        } else {
          alert(`Storage is working! Family ID: ${result.familyId}`)
        }
        return result
      }
      
      window.viewStorage = () => {
        return storage.viewAll()
      }
      
      console.log('💡 Debug helpers available:')
      console.log('  - testStorage() - Test if localStorage is working')
      console.log('  - viewStorage() - View all stored data for current family')
    }

    // Initialize data structure when app loads
    if (isAuthenticated()) {
      // Test storage before initializing
      const storageTest = storage.test()
      if (!storageTest.available) {
        console.error('Storage is not available:', storageTest.error)
        // Show a warning but don't block the app
        if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
          console.warn('⚠️ localStorage may not be working. Data may not be saved.')
        }
      }
      
      // Sync all data from backend first (backend is source of truth)
      storage.syncAllFromBackend().then(() => {
        // Then initialize defaults if needed
        initializeData()
      }).catch(error => {
        console.error('Error syncing from backend:', error)
        // Still initialize defaults even if sync fails
        initializeData()
      })
    }
  }, [])

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<PrivateAdminRoute><Dashboard /></PrivateAdminRoute>} />
          <Route path="elder-financials" element={<PrivateAdminRoute><ElderFinancials /></PrivateAdminRoute>} />
          <Route path="elder-expenses" element={<PrivateAdminRoute><ElderExpenses /></PrivateAdminRoute>} />
          <Route path="shevah-coverage" element={<PrivateAdminRoute><ShevahCoverage /></PrivateAdminRoute>} />
          <Route path="caretaker-payslips" element={<CaretakerPayslips />} />
          <Route path="caretaker-worklog" element={<CaretakerWorklog />} />
          <Route path="settings" element={<PrivateAdminRoute><Settings /></PrivateAdminRoute>} />
          <Route path="user-management" element={<PrivateAdminRoute><UserManagement /></PrivateAdminRoute>} />
          <Route path="action-log" element={<PrivateAdminRoute><ActionLog /></PrivateAdminRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

