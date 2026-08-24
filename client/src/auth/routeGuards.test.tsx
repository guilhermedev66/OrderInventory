import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '@/auth/authContext'
import { RequireAuth } from '@/auth/RequireAuth'
import { RequireRole } from '@/auth/RequireRole'
import type { Role } from '@/types/api'

function authValue(roles: Role[] = [], authenticated = true): AuthContextValue {
  return {
    identity: authenticated
      ? { userId: 'user-1', email: 'user@example.com', roles, expiresAtUtc: Date.now() + 60_000 }
      : null,
    isAuthenticated: authenticated,
    isReady: true,
    sessionExpired: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    hasRole: (...required) => required.some((role) => roles.includes(role)),
    acknowledgeExpiry: vi.fn(),
  }
}

function renderRoutes(value: AuthContextValue, initialEntry = '/private') {
  return render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/login" element={<p>Página de login</p>} />
          <Route path="/403" element={<p>Acesso negado</p>} />
          <Route element={<RequireAuth />}>
            <Route path="/private" element={<p>Área autenticada</p>} />
            <Route element={<RequireRole roles={['Admin']} />}>
              <Route path="/admin" element={<p>Área administrativa</p>} />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('route guards', () => {
  it('redirects an unauthenticated visitor to login', () => {
    renderRoutes(authValue([], false))
    expect(screen.getByText('Página de login')).toBeInTheDocument()
  })

  it('allows an authenticated user into a protected route', () => {
    renderRoutes(authValue(['User']))
    expect(screen.getByText('Área autenticada')).toBeInTheDocument()
  })

  it('blocks a user without the required role and allows an admin', () => {
    const blocked = renderRoutes(authValue(['User']), '/admin')
    expect(screen.getByText('Acesso negado')).toBeInTheDocument()
    blocked.unmount()

    renderRoutes(authValue(['Admin']), '/admin')
    expect(screen.getByText('Área administrativa')).toBeInTheDocument()
  })
})
