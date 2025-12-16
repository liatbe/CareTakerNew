import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { isAuthenticated } from './utils/auth'
import { initializeData } from './utils/storage'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ElderFinancials from './pages/ElderFinancials'
import ElderExpenses from './pages/ElderExpenses'
import ShevahCoverage from './pages/ShevahCoverage'
import CaretakerPayslips from './pages/CaretakerPayslips'
import CaretakerWorklog from './pages/CaretakerWorklog'
import Settings from './pages/Settings'
import Layout from './components/Layout'
import './App.css'

const PrivateRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" replace />
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
    // Initialize data structure when app loads
    if (isAuthenticated()) {
      initializeData()
    }
  }, [])

  return (
    <BrowserRouter>
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
          <Route index element={<Dashboard />} />
          <Route path="elder-financials" element={<ElderFinancials />} />
          <Route path="elder-expenses" element={<ElderExpenses />} />
          <Route path="shevah-coverage" element={<ShevahCoverage />} />
          <Route path="caretaker-payslips" element={<CaretakerPayslips />} />
          <Route path="caretaker-worklog" element={<CaretakerWorklog />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

