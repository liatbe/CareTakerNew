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
  const [showPassword, setShowPassword] = useState(false)
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false)

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated()) {
      navigate('/')
    }
  }, [navigate])

  // Validate that string contains only English characters (letters, numbers, and common symbols)
  const isEnglishOnly = (str) => {
    // Allow: letters (a-z, A-Z), numbers (0-9), and common symbols (!@#$%^&*()_+-=[]{}|;:,.<>?)
    return /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?]*$/.test(str)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(username, password)
      
      if (result.success) {
        initializeData()
        // Scroll to top before navigation
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
        navigate('/')
      } else {
        setError(result.error || t('login.error'))
      }
    } catch (error) {
      console.error('Login error:', error)
      setError(t('login.error'))
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    
    // Validation
    if (!registerName || !registerUsername || !registerPassword || !registerContractStartDate || !registerMonthlyBaseAmount) {
      setError(t('login.registerRequired', 'All fields are required'))
      return
    }
    
    // Validate English-only characters
    if (!isEnglishOnly(registerUsername)) {
      setError(t('login.usernameEnglishOnly', 'Username must contain only English characters (letters, numbers, and symbols)'))
      return
    }
    
    if (!isEnglishOnly(registerPassword)) {
      setError(t('login.passwordEnglishOnly', 'Password must contain only English characters (letters, numbers, and symbols)'))
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
    
    try {
      const result = await register(
        registerUsername, 
        registerPassword, 
        registerName,
        registerContractStartDate,
        monthlyAmount
      )
      
      if (result.success) {
        initializeData()
        // Scroll to top before navigation
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
        navigate('/')
      } else {
        setError(result.error || t('login.registerError', 'Registration failed'))
      }
    } catch (error) {
      console.error('Registration error:', error)
      setError(t('login.registerError', 'Registration failed'))
    } finally {
      setLoading(false)
    }
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
                <small className="form-hint">{t('login.usernameEnglishHint', 'Username must be in English (letters, numbers, and symbols only)')}</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="password">{t('login.password')}</label>
                <div className="password-input-wrapper">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
                <small className="form-hint">{t('login.passwordEnglishHint', 'Password must be in English (letters, numbers, and symbols only)')}</small>
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
                <small className="form-hint">{t('login.usernameEnglishHint', 'Username must be in English (letters, numbers, and symbols only)')}</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="registerPassword">{t('login.password')}</label>
                <div className="password-input-wrapper">
                  <input
                    id="registerPassword"
                    type={showRegisterPassword ? "text" : "password"}
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    aria-label={showRegisterPassword ? "Hide password" : "Show password"}
                  >
                    {showRegisterPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
                <small className="form-hint">{t('login.passwordEnglishHint', 'Password must be in English (letters, numbers, and symbols only)')}</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="registerConfirmPassword">{t('login.confirmPassword')}</label>
                <div className="password-input-wrapper">
                  <input
                    id="registerConfirmPassword"
                    type={showRegisterConfirmPassword ? "text" : "password"}
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowRegisterConfirmPassword(!showRegisterConfirmPassword)}
                    aria-label={showRegisterConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showRegisterConfirmPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
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
                    setShowRegisterPassword(false)
                    setShowRegisterConfirmPassword(false)
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

