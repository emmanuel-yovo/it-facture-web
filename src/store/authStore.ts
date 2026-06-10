import { create } from 'zustand'

interface User {
  id: string
  username?: string
  full_name?: string
  role: 'superadmin' | 'admin' | 'comptable' | 'user'
}

interface AuthState {
  user: User | null
  workspaceId: string | null
  workspacePlan: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  setWorkspaceId: (workspaceId: string | null) => void
  setWorkspacePlan: (plan: string | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  workspaceId: null,
  workspacePlan: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  setWorkspaceId: (workspaceId) => set({ workspaceId }),
  setWorkspacePlan: (workspacePlan) => set({ workspacePlan }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, workspaceId: null, workspacePlan: null, isAuthenticated: false })
}))
