// Authentication system
// Uses backend API (Supabase) if configured, otherwise falls back to localStorage

import * as apiAuth from './apiAuth.js'

// Re-export all functions from apiAuth
// This allows the app to use the same API whether backend is configured or not
export const login = apiAuth.login
export const register = apiAuth.register
export const logout = apiAuth.logout
export const isAuthenticated = apiAuth.isAuthenticated
export const getCurrentUser = apiAuth.getCurrentUser
export const getFamilyId = apiAuth.getFamilyId
export const getUserRole = apiAuth.getUserRole
export const isAdmin = apiAuth.isAdmin
export const getFamilyUsers = apiAuth.getFamilyUsers
export const addFamilyUser = apiAuth.addFamilyUser
export const deleteFamilyUser = apiAuth.deleteFamilyUser
