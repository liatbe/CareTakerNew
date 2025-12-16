import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { login, isAuthenticated, register } from '../utils/auth'
import { initializeData } from '../utils/storage'
import LanguageSwitcher from '../components/LanguageSwitcher'
import './Login.css'

const Login = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [registerName, setRegisterName] = useState('')
  const [registerUsername, setRegisterUsername] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('')
  const [registerContractStartDate, setRegisterContractStartDate] = useState(new Date().toISOString().split('T')[0])
  const [registerMonthlyBaseAmount, setRegisterMonthlyBaseAmount] = useState('6250')

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated()) {
      navigate('/')
    }
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = login(username, password)
    
    if (result.success) {
      initializeData()
      navigate('/')
    } else {
      setError(t('login.error'))
    }
    
    setLoading(false)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    
    // Validation
    if (!registerName || !registerUsername || !registerPassword || !registerContractStartDate || !registerMonthlyBaseAmount) {
      setError(t('login.registerRequired', 'All fields are required'))
      return
    }
    
    if (registerPassword !== registerConfirmPassword) {
      setError(t('login.passwordMismatch', 'Passwords do not match'))
      return
    }
    
    if (registerPassword.length < 4) {
      setError(t('login.passwordTooShort', 'Password must be at least 4 characters'))
      return
    }
    
    const monthlyAmount = parseFloat(registerMonthlyBaseAmount)
    if (isNaN(monthlyAmount) || monthlyAmount <= 0) {
      setError(t('login.invalidAmount', 'Monthly base amount must be a valid positive number'))
      return
    }
    
    setLoading(true)
    
    const result = register(
      registerUsername, 
      registerPassword, 
      registerName,
      registerContractStartDate,
      monthlyAmount
    )
    
    if (result.success) {
      initializeData()
      navigate('/')
    } else {
      setError(result.error || t('login.registerError', 'Registration failed'))
    }
    
    setLoading(false)
  }

  return (
    <div className="login-container">
      <div className="login-language-switcher">
        <LanguageSwitcher />
      </div>
      <div className="login-box">
        <h1 className="login-title">{t('login.title')}</h1>
        <p className="login-subtitle">{t('login.subtitle')}</p>
        
        {!showRegister ? (
          <>
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="username">{t('login.username')}</label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password">{t('login.password')}</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              
              {error && <div className="error-message">{error}</div>}
              
              <button type="submit" className="login-button" disabled={loading}>
                {loading ? '...' : t('login.loginButton')}
              </button>
            </form>
            
            <div className="login-footer">
              <p className="register-link">
                {t('login.noAccount', "Don't have an account?")}{' '}
                <button 
                  type="button" 
                  className="link-button"
                  onClick={() => {
                    setShowRegister(true)
                    setError('')
                  }}
                >
                  {t('login.register', 'Register')}
                </button>
              </p>
              <div className="login-demo">
                <p>Demo credentials: family1 / family1</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <form onSubmit={handleRegister} className="login-form">
              <div className="form-group">
                <label htmlFor="registerName">{t('login.name')}</label>
                <input
                  id="registerName"
                  type="text"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="registerUsername">{t('login.username')}</label>
                <input
                  id="registerUsername"
                  type="text"
                  value={registerUsername}
                  onChange={(e) => setRegisterUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="registerPassword">{t('login.password')}</label>
                <input
                  id="registerPassword"
                  type="password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="registerConfirmPassword">{t('login.confirmPassword')}</label>
                <input
                  id="registerConfirmPassword"
                  type="password"
                  value={registerConfirmPassword}
                  onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="registerContractStartDate">{t('login.contractStartDate')}</label>
                <input
                  id="registerContractStartDate"
                  type="date"
                  value={registerContractStartDate}
                  onChange={(e) => setRegisterContractStartDate(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="registerMonthlyBaseAmount">{t('login.monthlyBaseAmount')}</label>
                <input
                  id="registerMonthlyBaseAmount"
                  type="number"
                  value={registerMonthlyBaseAmount}
                  onChange={(e) => setRegisterMonthlyBaseAmount(e.target.value)}
                  required
                  step="0.01"
                  min="0"
                />
                <span className="currency-hint">₪</span>
              </div>
              
              {error && <div className="error-message">{error}</div>}
              
              <button type="submit" className="login-button" disabled={loading}>
                {loading ? '...' : t('login.registerButton')}
              </button>
            </form>
            
            <div className="login-footer">
              <p className="register-link">
                {t('login.haveAccount', 'Already have an account?')}{' '}
                <button 
                  type="button" 
                  className="link-button"
                  onClick={() => {
                    setShowRegister(false)
                    setError('')
                    setRegisterName('')
                    setRegisterUsername('')
                    setRegisterPassword('')
                    setRegisterConfirmPassword('')
                    setRegisterContractStartDate(new Date().toISOString().split('T')[0])
                    setRegisterMonthlyBaseAmount('6250')
                  }}
                >
                  {t('login.loginButton')}
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Login

