import { describe, expect, it } from 'vitest'
import { decodeToken, hasRole, isExpired } from '@/auth/jwt'

// Mirrors JwtTokenService.cs: claims built from a raw System.IdentityModel.Tokens.Jwt
// Claim list, so the role claim keeps its full ClaimTypes.Role URI as the JSON key.
const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'

function makeToken(payload: Record<string, unknown>): string {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encode = (obj: object) => btoa(JSON.stringify(obj)).replace(/=+$/, '')
  return `${encode(header)}.${encode(payload)}.signature`
}

describe('decodeToken', () => {
  it('reads sub, email and the long-form role claim', () => {
    const token = makeToken({
      sub: 'user-1',
      email: 'admin@example.com',
      [ROLE_CLAIM]: 'Admin',
      exp: 9999999999,
      iat: 1000000000,
    })

    const identity = decodeToken(token)

    expect(identity).not.toBeNull()
    expect(identity?.userId).toBe('user-1')
    expect(identity?.email).toBe('admin@example.com')
    expect(identity?.roles).toEqual(['Admin'])
  })

  it('normalizes multiple roles to an array', () => {
    const token = makeToken({
      sub: 'user-2',
      email: 'multi@example.com',
      [ROLE_CLAIM]: ['Manager', 'Admin'],
      exp: 9999999999,
      iat: 1000000000,
    })

    expect(decodeToken(token)?.roles).toEqual(['Manager', 'Admin'])
  })

  it('returns null for a malformed token instead of throwing', () => {
    expect(decodeToken('not-a-jwt')).toBeNull()
  })
})

describe('isExpired', () => {
  it('is true once expiresAtUtc is in the past', () => {
    expect(isExpired({ userId: 'u', email: 'e', roles: [], expiresAtUtc: Date.now() - 1000 })).toBe(true)
  })

  it('is false while expiresAtUtc is in the future', () => {
    expect(isExpired({ userId: 'u', email: 'e', roles: [], expiresAtUtc: Date.now() + 1000 })).toBe(false)
  })
})

describe('hasRole', () => {
  it('matches when the identity holds any of the requested roles', () => {
    const identity = { userId: 'u', email: 'e', roles: ['Manager'] as const, expiresAtUtc: Date.now() + 1000 }
    expect(hasRole(identity, 'Manager', 'Admin')).toBe(true)
    expect(hasRole(identity, 'Admin')).toBe(false)
  })

  it('is false for a null identity', () => {
    expect(hasRole(null, 'User')).toBe(false)
  })
})
