// Data storage utilities using localStorage
// In production, this should use a proper backend API

const getStorageKey = (key) => {
  const familyId = getFamilyId()
  return `caretaker_${familyId}_${key}`
}

const getFamilyId = () => {
  const authData = localStorage.getItem('caretaker_auth')
  if (!authData) return 'default'
  
  try {
    const auth = JSON.parse(authData)
    return auth.familyId || 'default'
  } catch {
    return 'default'
  }
}

export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const data = localStorage.getItem(getStorageKey(key))
      return data ? JSON.parse(data) : defaultValue
    } catch {
      return defaultValue
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(getStorageKey(key), JSON.stringify(value))
      return true
    } catch {
      return false
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(getStorageKey(key))
      return true
    } catch {
      return false
    }
  },
  
  clear: () => {
    const familyId = getFamilyId()
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(`caretaker_${familyId}_`)) {
        localStorage.removeItem(key)
      }
    })
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

