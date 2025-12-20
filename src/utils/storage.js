// Data storage utilities
// Backend (Supabase) is the source of truth - all data is saved to and fetched from backend
// localStorage is only used as a cache for immediate access
// All operations prioritize backend to ensure cross-device synchronization

import api from './api.js'

// Enable debug logging (set to false to disable)
const DEBUG_STORAGE = true

// Check if backend is configured
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const USE_BACKEND = SUPABASE_URL && SUPABASE_ANON_KEY

// Cache of pending backend operations to avoid duplicate requests
const pendingGets = new Map()
const pendingSets = new Map()

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

// Sync to backend - backend is source of truth, must complete successfully
const syncToBackend = async (operation, key, value = null) => {
  if (!USE_BACKEND) {
    // If no backend configured, only use localStorage
    return true
  }
  
  try {
    if (operation === 'set') {
      // Check if there's already a pending set for this key
      if (pendingSets.has(key)) {
        await pendingSets.get(key)
      } else {
        const promise = api.set(key, value)
        pendingSets.set(key, promise)
        try {
          await promise
        } finally {
          pendingSets.delete(key)
        }
      }
    } else if (operation === 'remove') {
      await api.remove(key)
    } else if (operation === 'clear') {
      await api.clear()
    }
    return true
  } catch (error) {
    console.error(`Backend sync failed for ${key}:`, error)
    // Log error but don't throw - allow localStorage to work as fallback
    return false
  }
}

export const storage = {
  // GET - synchronous for immediate response, but prioritizes backend data
  // Returns cached value immediately, but syncs from backend in background
  get: (key, defaultValue = null) => {
    // If backend is configured, try to fetch from backend first (in background)
    // This ensures we get the latest data from backend
    if (USE_BACKEND) {
      // Check if there's already a pending get for this key
      if (!pendingGets.has(key)) {
        const promise = api.get(key).then(backendData => {
          if (backendData !== null) {
            // Update cache with backend data
            if (isLocalStorageAvailable()) {
              const storageKey = getStorageKey(key)
              localStorage.setItem(storageKey, JSON.stringify(backendData))
            }
            if (DEBUG_STORAGE) {
              console.log(`📖 [Storage GET - Backend] ${key} →`, backendData)
            }
          }
          pendingGets.delete(key)
          return backendData
        }).catch(error => {
          console.error(`Error fetching ${key} from backend:`, error)
          pendingGets.delete(key)
          return null
        })
        pendingGets.set(key, promise)
      }
    }
    
    // Read from cache for immediate response
    if (isLocalStorageAvailable()) {
      try {
        const storageKey = getStorageKey(key)
        const data = localStorage.getItem(storageKey)
        if (data !== null) {
          const parsed = JSON.parse(data)
          if (DEBUG_STORAGE) {
            console.log(`📖 [Storage GET - Cache] ${key} →`, parsed)
          }
          return parsed
        }
      } catch (e) {
        console.error(`Error reading from cache for "${key}":`, e)
      }
    }
    
    if (DEBUG_STORAGE) {
      console.log(`📖 [Storage GET] ${key} → default value (not found)`)
    }
    return defaultValue
  },
  
  // GET from backend (async) - use this when you need the latest data from backend
  getFromBackend: async (key, defaultValue = null) => {
    if (!USE_BACKEND) {
      // Fallback to localStorage if no backend
      return storage.get(key, defaultValue)
    }
    
    try {
      const backendData = await api.get(key)
      if (backendData !== null) {
        // Update cache
        if (isLocalStorageAvailable()) {
          const storageKey = getStorageKey(key)
          localStorage.setItem(storageKey, JSON.stringify(backendData))
        }
        if (DEBUG_STORAGE) {
          console.log(`📖 [Storage GET - Backend (async)] ${key} →`, backendData)
        }
        return backendData
      }
      return defaultValue
    } catch (error) {
      console.error(`Error fetching ${key} from backend:`, error)
      // Fallback to cache
      return storage.get(key, defaultValue)
    }
  },
  
  // SET - saves to cache immediately, then syncs to backend (backend is source of truth)
  set: (key, value) => {
    // Update localStorage cache immediately for responsive UI
    if (isLocalStorageAvailable()) {
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
          console.log(`💾 [Storage SET - Cache] ${key} →`, value)
        }
      } catch (e) {
        if (e.name === 'QuotaExceededError') {
          console.error('Storage quota exceeded. Please clear some data.')
          alert('Storage quota exceeded. Please clear some browser data or use a different browser.')
          return false
        } else {
          console.error(`Error saving storage key "${key}":`, e)
          return false
        }
      }
    }
    
    // Sync to backend immediately (backend is source of truth, must succeed)
    // Don't await to keep it non-blocking, but ensure it completes
    syncToBackend('set', key, value).then(success => {
      if (success) {
        if (DEBUG_STORAGE) {
          console.log(`💾 [Storage SET - Backend] ${key} synced successfully`)
        }
      } else {
        console.error(`💾 [Storage SET - Backend] ${key} sync failed`)
      }
    }).catch(error => {
      console.error(`Backend sync error for ${key}:`, error)
    })
    
    return true
  },
  
  // SET to backend (async) - use this when you need to ensure backend save completes
  setToBackend: async (key, value) => {
    // Update cache first
    if (isLocalStorageAvailable()) {
      try {
        const storageKey = getStorageKey(key)
        localStorage.setItem(storageKey, JSON.stringify(value))
      } catch (e) {
        console.error(`Error updating cache for ${key}:`, e)
      }
    }
    
    // Save to backend (source of truth)
    if (!USE_BACKEND) {
      return true
    }
    
    try {
      const success = await syncToBackend('set', key, value)
      if (DEBUG_STORAGE) {
        console.log(`💾 [Storage SET - Backend (async)] ${key} ${success ? 'synced' : 'failed'}`)
      }
      return success
    } catch (error) {
      console.error(`Backend save error for ${key}:`, error)
      return false
    }
  },
  
  // REMOVE - removes from cache immediately, then from backend (source of truth)
  remove: (key) => {
    // Remove from localStorage cache immediately
    if (isLocalStorageAvailable()) {
      try {
        const storageKey = getStorageKey(key)
        localStorage.removeItem(storageKey)
        if (DEBUG_STORAGE) {
          console.log(`🗑️  [Storage REMOVE - Cache] ${key}`)
        }
      } catch (e) {
        console.error(`Error removing storage key "${key}":`, e)
        return false
      }
    }
    
    // Remove from backend (source of truth)
    syncToBackend('remove', key).then(success => {
      if (success) {
        if (DEBUG_STORAGE) {
          console.log(`🗑️  [Storage REMOVE - Backend] ${key} removed successfully`)
        }
      } else {
        console.error(`🗑️  [Storage REMOVE - Backend] ${key} remove failed`)
      }
    }).catch(error => {
      console.error(`Backend remove error for ${key}:`, error)
    })
    
    return true
  },
  
  // CLEAR - clears cache immediately, then clears backend (source of truth)
  clear: () => {
    // Clear localStorage cache immediately
    if (isLocalStorageAvailable()) {
      try {
        const familyId = getFamilyId()
        const keys = Object.keys(localStorage)
        keys.forEach(key => {
          if (key.startsWith(`caretaker_${familyId}_`)) {
            localStorage.removeItem(key)
          }
        })
        if (DEBUG_STORAGE) {
          console.log(`🗑️  [Storage CLEAR - Cache] cleared for family ${familyId}`)
        }
      } catch (e) {
        console.error('Error clearing storage:', e)
        return false
      }
    }
    
    // Clear backend (source of truth)
    syncToBackend('clear').then(success => {
      if (success) {
        if (DEBUG_STORAGE) {
          console.log(`🗑️  [Storage CLEAR - Backend] cleared successfully`)
        }
      } else {
        console.error(`🗑️  [Storage CLEAR - Backend] clear failed`)
      }
    }).catch(error => {
      console.error('Backend clear error:', error)
    })
    
    return true
  },
  
  // Sync all data from backend to cache - call this on app initialization
  syncAllFromBackend: async () => {
    if (!USE_BACKEND) {
      if (DEBUG_STORAGE) {
        console.log('📦 [Storage] Backend not configured, skipping sync')
      }
      return
    }
    
    try {
      const familyId = getFamilyId()
      if (!familyId) {
        if (DEBUG_STORAGE) {
          console.log('📦 [Storage] No family ID, skipping sync')
        }
        return
      }
      
      // Fetch all data for this family from backend
      const response = await fetch(`${SUPABASE_URL}/rest/v1/family_data?family_id=eq.${familyId}`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Update cache with all backend data
      if (isLocalStorageAvailable()) {
        data.forEach(item => {
          try {
            const storageKey = getStorageKey(item.key)
            localStorage.setItem(storageKey, item.value)
          } catch (e) {
            console.error(`Error updating cache for ${item.key}:`, e)
          }
        })
        
        if (DEBUG_STORAGE) {
          console.log(`📦 [Storage] Synced ${data.length} items from backend to cache`)
        }
      }
      
      return data
    } catch (error) {
      console.error('Error syncing from backend:', error)
      return []
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
      taagidPayment: 2000,
      taagidHandling: 840,
      havraaAmountPerDay: 174,
      havraaDays: 5
    })
  }
}
