// Action logging system for tracking caretaker actions
import { storage } from './storage.js'
import { getCurrentUser } from './auth.js'

// Log an action performed by a user
export const logAction = (action, details = {}) => {
  const user = getCurrentUser()
  if (!user) return

  const actionLog = storage.get('actionLog', [])
  
  const logEntry = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    username: user.username,
    role: user.role,
    familyId: user.familyId,
    action: action,
    details: details
  }

  actionLog.unshift(logEntry) // Add to beginning
  
  // Keep only last 1000 entries to prevent storage bloat
  if (actionLog.length > 1000) {
    actionLog.splice(1000)
  }

  storage.set('actionLog', actionLog)
}

// Get action log for current family (admin only)
export const getActionLog = (filterByRole = null) => {
  const user = getCurrentUser()
  if (!user) return []

  const actionLog = storage.get('actionLog', [])
  
  // Filter by family
  let filtered = actionLog.filter(log => log.familyId === user.familyId)
  
  // Filter by role if specified
  if (filterByRole) {
    filtered = filtered.filter(log => log.role === filterByRole)
  }

  return filtered
}

// Clear action log (admin only)
export const clearActionLog = () => {
  storage.set('actionLog', [])
}

