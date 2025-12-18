// Data storage utilities using localStorage
// In production, this should use a proper backend API

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

export const storage = {
  get: (key, defaultValue = null) => {
    if (!isLocalStorageAvailable()) {
      console.warn('localStorage not available, returning default value')
      return defaultValue
    }
    
    try {
      const storageKey = getStorageKey(key)
      const data = localStorage.getItem(storageKey)
      if (data === null) {
        return defaultValue
      }
      return JSON.parse(data)
    } catch (e) {
      console.error(`Error reading storage key "${key}":`, e)
      return defaultValue
    }
  },
  
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
  
  remove: (key) => {
    if (!isLocalStorageAvailable()) {
      return false
    }
    
    try {
      const storageKey = getStorageKey(key)
      localStorage.removeItem(storageKey)
      return true
    } catch (e) {
      console.error(`Error removing storage key "${key}":`, e)
      return false
    }
  },
  
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
      return true
    } catch (e) {
      console.error('Error clearing storage:', e)
      return false
    }
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
      const familyTestResult = storage.set('__family_test__', { test: true })
      if (!familyTestResult) {
        return { available: false, error: 'Family-scoped storage failed' }
      }
      storage.remove('__family_test__')
      
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

