// Data storage utilities
// Uses backend API (Supabase) if configured, otherwise falls back to localStorage
// This allows data to be accessible across devices when backend is configured
// Works synchronously for backward compatibility, syncs to backend in background

import api from './api.js'

// Enable debug logging (set to false to disable)
const DEBUG_STORAGE = true

// Check if localStorage is available
const isLocalStorageAvailable = () => {
  try {
    const test = '__localStorage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch (e) {
    console.error('localStorage is not available:', e)
    return false
  }
}

const getStorageKey = (key) => {
  const familyId = getFamilyId()
  return `caretaker_${familyId}_${key}`
}

const getFamilyId = () => {
  if (!isLocalStorageAvailable()) return 'default'
  
  try {
    const authData = localStorage.getItem('caretaker_auth')
    if (!authData) return 'default'
    
    const auth = JSON.parse(authData)
    return auth.familyId || 'default'
  } catch (e) {
    console.error('Error getting familyId:', e)
    return 'default'
  }
}

// Background sync queue
const syncQueue = []
let isSyncing = false

const syncToBackend = async () => {
  if (isSyncing || syncQueue.length === 0) return
  isSyncing = true
  
  while (syncQueue.length > 0) {
    const { operation, key, value } = syncQueue.shift()
    try {
      if (operation === 'set') {
        await api.set(key, value)
      } else if (operation === 'remove') {
        await api.remove(key)
      }
    } catch (error) {
      console.warn(`Background sync failed for ${key}:`, error)
    }
  }
  
  isSyncing = false
}

export const storage = {
  // Synchronous GET - reads from localStorage immediately, syncs from backend in background
  get: (key, defaultValue = null) => {
    if (!isLocalStorageAvailable()) {
      console.warn('localStorage not available, returning default value')
      return defaultValue
    }
    
    try {
      const storageKey = getStorageKey(key)
      const data = localStorage.getItem(storageKey)
      if (data === null) {
        // Try to load from backend in background
        api.get(key).then(backendData => {
          if (backendData !== null) {
            localStorage.setItem(storageKey, JSON.stringify(backendData))
            if (DEBUG_STORAGE) {
              console.log(`📖 [Storage GET - API sync] ${key} →`, backendData)
            }
          }
        }).catch(() => {})
        
        if (DEBUG_STORAGE) {
          console.log(`📖 [Storage GET] ${key} → default value (not found)`)
        }
        return defaultValue
      }
      const parsed = JSON.parse(data)
      if (DEBUG_STORAGE) {
        console.log(`📖 [Storage GET] ${key} →`, parsed)
      }
      return parsed
    } catch (e) {
      console.error(`Error reading storage key "${key}":`, e)
      return defaultValue
    }
  },
  
  // Synchronous SET - saves to localStorage immediately, syncs to backend in background
  set: (key, value) => {
    if (!isLocalStorageAvailable()) {
      console.error('localStorage not available, cannot save data')
      return false
    }
    
    try {
      const storageKey = getStorageKey(key)
      const stringValue = JSON.stringify(value)
      localStorage.setItem(storageKey, stringValue)
      // Verify the save worked
      const verify = localStorage.getItem(storageKey)
      if (verify !== stringValue) {
        console.error(`Storage verification failed for key: ${storageKey}`)
        return false
      }
      if (DEBUG_STORAGE) {
        console.log(`💾 [Storage SET] ${key} →`, value)
      }
      
      // Queue for background sync to backend
      syncQueue.push({ operation: 'set', key, value })
      syncToBackend()
      
      return true
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded. Please clear some data.')
        alert('Storage quota exceeded. Please clear some browser data or use a different browser.')
      } else {
        console.error(`Error saving storage key "${key}":`, e)
      }
      return false
    }
  },
  
  // Synchronous REMOVE - removes from localStorage immediately, syncs to backend in background
  remove: (key) => {
    if (!isLocalStorageAvailable()) {
      return false
    }
    
    try {
      const storageKey = getStorageKey(key)
      localStorage.removeItem(storageKey)
      if (DEBUG_STORAGE) {
        console.log(`🗑️  [Storage REMOVE] ${key}`)
      }
      
      // Queue for background sync to backend
      syncQueue.push({ operation: 'remove', key })
      syncToBackend()
      
      return true
    } catch (e) {
      console.error(`Error removing storage key "${key}":`, e)
      return false
    }
  },
  
  // Synchronous CLEAR - clears localStorage immediately, syncs to backend in background
  clear: () => {
    if (!isLocalStorageAvailable()) {
      return false
    }
    
    try {
      const familyId = getFamilyId()
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith(`caretaker_${familyId}_`)) {
          localStorage.removeItem(key)
        }
      })
      
      // Sync clear to backend
      api.clear().catch(() => {})
      
      return true
    } catch (e) {
      console.error('Error clearing storage:', e)
      return false
    }
  },
  
  // View all stored data for current family
  viewAll: () => {
    if (!isLocalStorageAvailable()) {
      return { error: 'localStorage not available' }
    }
    
    const familyId = getFamilyId()
    const keys = Object.keys(localStorage)
    const familyKeys = keys.filter(key => key.startsWith(`caretaker_${familyId}_`))
    
    const data = {}
    familyKeys.forEach(key => {
      const shortKey = key.replace(`caretaker_${familyId}_`, '')
      try {
        data[shortKey] = JSON.parse(localStorage.getItem(key))
      } catch (e) {
        data[shortKey] = localStorage.getItem(key)
      }
    })
    
    console.log(`📦 [Storage] All data for family "${familyId}":`, data)
    return { familyId, data, keys: familyKeys }
  },
  
  // Diagnostic function to test storage
  test: () => {
    const testKey = '__storage_test__'
    const testValue = { test: true, timestamp: Date.now() }
    
    if (!isLocalStorageAvailable()) {
      return { available: false, error: 'localStorage is not available' }
    }
    
    try {
      // Test direct localStorage write (bypass family scoping for test)
      const stringValue = JSON.stringify(testValue)
      localStorage.setItem(testKey, stringValue)
      
      // Test read
      const readData = localStorage.getItem(testKey)
      if (!readData || readData !== stringValue) {
        localStorage.removeItem(testKey)
        return { available: false, error: 'Failed to read back written data' }
      }
      
      // Test JSON parsing
      const parsed = JSON.parse(readData)
      if (!parsed || parsed.test !== true) {
        localStorage.removeItem(testKey)
        return { available: false, error: 'Failed to parse stored data' }
      }
      
      // Clean up
      localStorage.removeItem(testKey)
      
      // Test family-scoped storage
      const storageKey = getStorageKey('__family_test__')
      localStorage.setItem(storageKey, JSON.stringify({ test: true }))
      const verify = localStorage.getItem(storageKey)
      if (!verify) {
        return { available: false, error: 'Family-scoped storage failed' }
      }
      localStorage.removeItem(storageKey)
      
      return { available: true, familyId: getFamilyId() }
    } catch (e) {
      try {
        localStorage.removeItem(testKey)
        localStorage.removeItem(getStorageKey('__family_test__'))
      } catch {}
      return { available: false, error: e.message || 'Unknown error' }
    }
  }
}

// Initialize default data structure
// Note: contractStartDate and monthlyBaseAmount are set during registration and not defaulted here
export const initializeData = () => {
  // Only initialize system defaults (activity charges and yearly payments)
  // Contract start date and monthly base amount are per-family and set during registration
  
  const activityCharges = storage.get('activityCharges')
  if (!activityCharges) {
    storage.set('activityCharges', {
      vacationDay: 250,
      sickDay: 0,
      shabbat: 426.4,
      pocketMoney: 100,
      hospitalVisit: 0,
      holidayVacationDay: 426.4
    })
  }
  
  const yearlyPayments = storage.get('yearlyPayments')
  if (!yearlyPayments) {
    storage.set('yearlyPayments', {
      medicalInsurance: 0,
      taagidPayment: 0,
      taagidHandling: 0
    })
  }
}
