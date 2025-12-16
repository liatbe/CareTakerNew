// Simple authentication system
// In production, this should use proper backend authentication

const STORAGE_KEY = 'caretaker_auth'
const USERS_KEY = 'caretaker_users'

// Initialize default users if none exist
if (!localStorage.getItem(USERS_KEY)) {
  const defaultUsers = [
    { username: 'family1', password: 'family1', familyId: 'family1' },
    { username: 'admin', password: 'admin', familyId: 'family1' }
  ]
  localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers))
}

export const login = (username, password) => {
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
  const user = users.find(u => u.username === username && u.password === password)
  
  if (user) {
    const authData = {
      username: user.username,
      familyId: user.familyId,
      loggedIn: true,
      timestamp: Date.now()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authData))
    return { success: true, user: authData }
  }
  
  return { success: false, error: 'Invalid credentials' }
}

export const logout = () => {
  localStorage.removeItem(STORAGE_KEY)
}

export const isAuthenticated = () => {
  const authData = localStorage.getItem(STORAGE_KEY)
  if (!authData) return false
  
  try {
    const auth = JSON.parse(authData)
    // Check if session is still valid (24 hours)
    const maxAge = 24 * 60 * 60 * 1000
    if (Date.now() - auth.timestamp > maxAge) {
      logout()
      return false
    }
    return auth.loggedIn === true
  } catch {
    return false
  }
}

export const getCurrentUser = () => {
  const authData = localStorage.getItem(STORAGE_KEY)
  if (!authData) return null
  
  try {
    return JSON.parse(authData)
  } catch {
    return null
  }
}

export const getFamilyId = () => {
  const user = getCurrentUser()
  return user?.familyId || null
}

export const register = (username, password, name, contractStartDate, monthlyBaseAmount) => {
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
  
  // Check if username already exists
  if (users.find(u => u.username === username)) {
    return { success: false, error: 'Username already exists' }
  }
  
  // Generate unique family ID
  const familyId = `family_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // Create new user
  const newUser = {
    username,
    password,
    name: name || username,
    familyId,
    contractStartDate,
    monthlyBaseAmount,
    createdAt: new Date().toISOString()
  }
  
  users.push(newUser)
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
  
  // Auto-login after registration
  const authData = {
    username: newUser.username,
    familyId: newUser.familyId,
    loggedIn: true,
    timestamp: Date.now()
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(authData))
  
  // Save family-specific data immediately after registration
  // We need to temporarily set the familyId in storage context
  const storageKey = `caretaker_${familyId}_contractStartDate`
  localStorage.setItem(storageKey, JSON.stringify(contractStartDate))
  
  const monthlyBaseKey = `caretaker_${familyId}_monthlyBaseAmount`
  localStorage.setItem(monthlyBaseKey, JSON.stringify(monthlyBaseAmount))
  
  return { success: true, user: authData }
}

