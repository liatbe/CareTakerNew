// API service layer for backend storage
// This replaces localStorage with API calls to Supabase

// Configuration - these will be set via environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Check if we're using backend storage or localStorage fallback
const USE_BACKEND = SUPABASE_URL && SUPABASE_ANON_KEY

// Fallback to localStorage if backend is not configured
const FALLBACK_TO_LOCALSTORAGE = !USE_BACKEND

// Helper to get auth token from localStorage
const getAuthToken = () => {
  try {
    const authData = localStorage.getItem('caretaker_auth')
    if (!authData) return null
    const auth = JSON.parse(authData)
    return auth.token || null
  } catch {
    return null
  }
}

// Helper to get family ID
const getFamilyId = () => {
  try {
    const authData = localStorage.getItem('caretaker_auth')
    if (!authData) return null
    const auth = JSON.parse(authData)
    return auth.familyId || null
  } catch {
    return null
  }
}

// API client
const api = {
  // Generic GET request - always uses backend if configured
  async get(key) {
    if (FALLBACK_TO_LOCALSTORAGE) {
      // Only fallback if backend is not configured
      const data = localStorage.getItem(`caretaker_${getFamilyId()}_${key}`)
      return data ? JSON.parse(data) : null
    }

    try {
      const familyId = getFamilyId()
      if (!familyId) {
        console.warn('No family ID found, cannot fetch data')
        return null
      }

      const response = await fetch(`${SUPABASE_URL}/rest/v1/family_data?family_id=eq.${familyId}&key=eq.${key}`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      if (data && data.length > 0) {
        return JSON.parse(data[0].value)
      }
      return null
    } catch (error) {
      console.error(`Error fetching ${key} from backend:`, error)
      // Don't fallback to localStorage - return null so caller knows data is not available
      return null
    }
  },

  // Generic SET request - always uses backend if configured
  async set(key, value) {
    if (FALLBACK_TO_LOCALSTORAGE) {
      // Only fallback if backend is not configured
      localStorage.setItem(`caretaker_${getFamilyId()}_${key}`, JSON.stringify(value))
      return true
    }

    try {
      const familyId = getFamilyId()
      if (!familyId) {
        console.warn('No family ID found, cannot save data')
        return false
      }

      const payload = {
        family_id: familyId,
        key: key,
        value: JSON.stringify(value),
        updated_at: new Date().toISOString()
      }

      // Try to update first
      const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/family_data?family_id=eq.${familyId}&key=eq.${key}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      })

      // If update fails (404 or other error), insert new record
      if (updateResponse.status === 404 || !updateResponse.ok) {
        const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/family_data`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(payload)
        })

        if (!insertResponse.ok) {
          throw new Error(`Insert failed: ${insertResponse.status}`)
        }
      }

      return true
    } catch (error) {
      console.error(`Error saving ${key} to backend:`, error)
      // Don't fallback to localStorage - return false so caller knows save failed
      return false
    }
  },

  // Generic REMOVE request - always uses backend if configured
  async remove(key) {
    if (FALLBACK_TO_LOCALSTORAGE) {
      // Only fallback if backend is not configured
      localStorage.removeItem(`caretaker_${getFamilyId()}_${key}`)
      return true
    }

    try {
      const familyId = getFamilyId()
      if (!familyId) {
        return false
      }

      const response = await fetch(`${SUPABASE_URL}/rest/v1/family_data?family_id=eq.${familyId}&key=eq.${key}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      })

      return response.ok
    } catch (error) {
      console.error(`Error removing ${key} from backend:`, error)
      // Don't fallback - return false so caller knows remove failed
      return false
    }
  },

  // Clear all data for a family
  async clear() {
    if (FALLBACK_TO_LOCALSTORAGE) {
      const familyId = getFamilyId()
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith(`caretaker_${familyId}_`)) {
          localStorage.removeItem(key)
        }
      })
      return true
    }

    try {
      const familyId = getFamilyId()
      if (!familyId) {
        return false
      }

      const response = await fetch(`${SUPABASE_URL}/rest/v1/family_data?family_id=eq.${familyId}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      })

      return response.ok
    } catch (error) {
      console.error('Error clearing data:', error)
      return false
    }
  }
}

export default api

