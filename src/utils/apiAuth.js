// Backend authentication using Supabase
// This replaces localStorage-based auth

import api from './api.js'
import { storage } from './storage.js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

const USE_BACKEND = SUPABASE_URL && SUPABASE_ANON_KEY

// Fallback to localStorage if backend is not configured
const FALLBACK_TO_LOCALSTORAGE = !USE_BACKEND

const STORAGE_KEY = 'caretaker_auth'
const USERS_KEY = 'caretaker_users'

// Initialize default users for localStorage fallback
if (FALLBACK_TO_LOCALSTORAGE && !localStorage.getItem(USERS_KEY)) {
  const defaultUsers = [
    { id: '1', username: 'family1', password: 'family1', familyId: 'family1', role: 'admin' },
    { id: '2', username: 'admin', password: 'admin', familyId: 'family1', role: 'admin' }
  ]
  localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers))
}

export const login = async (username, password) => {
  if (FALLBACK_TO_LOCALSTORAGE) {
    // Fallback to localStorage
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
    const user = users.find(u => u.username === username && u.password === password)
    
    if (user) {
    const authData = {
      username: user.username,
      familyId: user.familyId,
      role: user.role || 'admin', // Default to admin for localStorage fallback
      loggedIn: true,
      timestamp: Date.now()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authData))
    return { success: true, user: authData }
    }
    
    return { success: false, error: 'Invalid credentials' }
  }

  // Backend authentication
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/users?username=eq.${encodeURIComponent(username)}&select=*`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status}`)
    }

    const users = await response.json()
    if (!users || users.length === 0) {
      return { success: false, error: 'Invalid credentials' }
    }

    const user = users[0]
    
    // In production, passwords should be hashed. For now, we'll do a simple comparison
    // TODO: Implement proper password hashing (bcrypt) on the backend
    if (user.password !== password) {
      return { success: false, error: 'Invalid credentials' }
    }

    const authData = {
      username: user.username,
      familyId: user.family_id,
      role: user.role || 'admin', // Get role from user
      loggedIn: true,
      timestamp: Date.now(),
      token: user.id // Using user ID as token for now
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(authData))
    return { success: true, user: authData }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'Login failed. Please try again.' }
  }
}

export const register = async (username, password, name, contractStartDate, monthlyBaseAmount) => {
  if (FALLBACK_TO_LOCALSTORAGE) {
    // Fallback to localStorage
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
    
    if (users.find(u => u.username === username)) {
      return { success: false, error: 'Username already exists' }
    }
    
    const familyId = `family_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newUser = {
      id: Date.now().toString(),
      username,
      password,
      name: name || username,
      familyId,
      role: 'admin', // First user is always admin
      contractStartDate,
      monthlyBaseAmount,
      createdAt: new Date().toISOString()
    }
    
    users.push(newUser)
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
    
    const authData = {
      username: newUser.username,
      familyId: newUser.familyId,
      loggedIn: true,
      timestamp: Date.now()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authData))
    
    // Save contract data using storage utility (for consistency and proper key formatting)
    storage.set('contractStartDate', contractStartDate)
    storage.set('monthlyBaseAmount', monthlyBaseAmount)
    
    return { success: true, user: authData }
  }

  // Backend registration
  try {
    // Check if username exists
    const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?username=eq.${encodeURIComponent(username)}&select=id`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (checkResponse.ok) {
      const existing = await checkResponse.json()
      if (existing && existing.length > 0) {
        return { success: false, error: 'Username already exists' }
      }
    }

    // Generate unique family ID
    const familyId = `family_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create new admin user (first user of a family is always admin)
    const newUser = {
      username,
      password, // TODO: Hash password before storing
      name: name || username,
      family_id: familyId,
      role: 'admin', // First user is always admin
      contract_start_date: contractStartDate,
      monthly_base_amount: monthlyBaseAmount,
      created_at: new Date().toISOString()
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(newUser)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Registration failed')
    }

    const createdUser = await response.json()
    const user = Array.isArray(createdUser) ? createdUser[0] : createdUser

    // Save contract data using storage (saves to localStorage immediately, syncs to backend in background)
    // This ensures Settings page can read the values right away
    storage.set('contractStartDate', contractStartDate)
    storage.set('monthlyBaseAmount', monthlyBaseAmount)

    // Auto-login after registration
    const authData = {
      username: user.username,
      familyId: user.family_id,
      role: user.role || 'admin',
      loggedIn: true,
      timestamp: Date.now(),
      token: user.id
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(authData))
    return { success: true, user: authData }
  } catch (error) {
    console.error('Registration error:', error)
    return { success: false, error: error.message || 'Registration failed. Please try again.' }
  }
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

export const getUserRole = () => {
  const user = getCurrentUser()
  return user?.role || 'admin' // Default to admin
}

export const isAdmin = () => {
  return getUserRole() === 'admin'
}

// Get all users for the current family (admin only)
export const getFamilyUsers = async () => {
  if (FALLBACK_TO_LOCALSTORAGE) {
    const familyId = getFamilyId()
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
    return users.filter(u => u.familyId === familyId)
  }

  try {
    const familyId = getFamilyId()
    if (!familyId) return []

    const response = await fetch(`${SUPABASE_URL}/rest/v1/users?family_id=eq.${familyId}&select=*`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching family users:', error)
    return []
  }
}

// Add a new user to the family (admin only)
export const addFamilyUser = async (username, password, name, role = 'caretaker') => {
  if (!isAdmin()) {
    return { success: false, error: 'Only admins can add users' }
  }

  if (FALLBACK_TO_LOCALSTORAGE) {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
    
    if (users.find(u => u.username === username)) {
      return { success: false, error: 'Username already exists' }
    }
    
    const familyId = getFamilyId()
    const newUser = {
      id: Date.now().toString(),
      username,
      password,
      name: name || username,
      familyId,
      role,
      createdAt: new Date().toISOString()
    }
    
    users.push(newUser)
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
    return { success: true, user: newUser }
  }

  // Backend: Add user
  try {
    const familyId = getFamilyId()
    if (!familyId) {
      return { success: false, error: 'No family ID found' }
    }

    // Check if username exists
    const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?username=eq.${encodeURIComponent(username)}&select=id`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (checkResponse.ok) {
      const existing = await checkResponse.json()
      if (existing && existing.length > 0) {
        return { success: false, error: 'Username already exists' }
      }
    }

    const newUser = {
      username,
      password, // TODO: Hash password
      name: name || username,
      family_id: familyId,
      role: role,
      created_at: new Date().toISOString()
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(newUser)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to add user')
    }

    const createdUser = await response.json()
    const user = Array.isArray(createdUser) ? createdUser[0] : createdUser

    return { success: true, user }
  } catch (error) {
    console.error('Error adding user:', error)
    return { success: false, error: error.message || 'Failed to add user' }
  }
}

// Delete a user (admin only)
export const deleteFamilyUser = async (userId) => {
  if (!isAdmin()) {
    return { success: false, error: 'Only admins can delete users' }
  }

  if (FALLBACK_TO_LOCALSTORAGE) {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
    const filtered = users.filter(u => u.id !== userId && u.username !== userId)
    localStorage.setItem(USERS_KEY, JSON.stringify(filtered))
    return { success: true }
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    return { success: response.ok }
  } catch (error) {
    console.error('Error deleting user:', error)
    return { success: false, error: error.message || 'Failed to delete user' }
  }
}

