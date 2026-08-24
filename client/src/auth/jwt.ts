import { jwtDecode } from 'jwt-decode'
import type { Role } from '@/types/api'

// JwtTokenService builds claims with a raw `System.IdentityModel.Tokens.Jwt` Claim
// list (not a mapped ClaimsIdentity), so the role claim keeps its full CLR URI as
// the JSON key instead of being shortened to "role".
const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'

interface RawTokenClaims {
  sub: string
  email: string
  exp: number
  iat: number
  [ROLE_CLAIM]?: string | string[]
}

export interface SessionIdentity {
  userId: string
  email: string
  roles: readonly Role[]
  expiresAtUtc: number
}

export function decodeToken(token: string): SessionIdentity | null {
  try {
    const claims = jwtDecode<RawTokenClaims>(token)
    const roleClaim = claims[ROLE_CLAIM]
    const roles = (Array.isArray(roleClaim) ? roleClaim : roleClaim ? [roleClaim] : []) as Role[]
    return {
      userId: claims.sub,
      email: claims.email,
      roles,
      expiresAtUtc: claims.exp * 1000,
    }
  } catch {
    return null
  }
}

export function isExpired(identity: SessionIdentity): boolean {
  return Date.now() >= identity.expiresAtUtc
}

export function hasRole(identity: SessionIdentity | null, ...roles: Role[]): boolean {
  if (!identity) return false
  return roles.some((role) => identity.roles.includes(role))
}
