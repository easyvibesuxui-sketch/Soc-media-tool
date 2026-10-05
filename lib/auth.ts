// Shared helpers for the auth pages (login, forgot/reset password, callback).
// Framework-free so both client pages and tests can import it.

/** Only same-site paths: "//evil.com" or "/\evil.com" would leave the site. */
export function safeNext(raw: string | null | undefined, fallback = '/tool'): string {
  return raw && /^\/(?![/\\])/.test(raw) ? raw : fallback
}

export const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { id: 'letter', label: 'A letter', test: (p: string) => /[A-Za-z]/.test(p) },
  { id: 'number', label: 'A number', test: (p: string) => /\d/.test(p) },
] as const

export const passwordIsValid = (p: string) => PASSWORD_RULES.every(r => r.test(p))

/** Where auth emails send people back to. supabase-js reads the session from the URL there. */
export function callbackUrl(next: string): string {
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
}

/**
 * Supabase errors carry a machine `code` (auth-js AuthApiError) whose raw
 * `message` is often unhelpful ("Invalid login credentials"). Map the ones
 * users actually hit to plain language.
 */
export type FriendlyAuthError = {
  code: string
  message: string
  /** Seconds until the same request may be retried, when Supabase says so. */
  retryAfter?: number
}

export function friendlyAuthError(err: unknown): FriendlyAuthError {
  const code =
    typeof err === 'object' && err !== null && 'code' in err && typeof err.code === 'string'
      ? err.code
      : ''
  const raw = err instanceof Error ? err.message : ''

  switch (code) {
    case 'invalid_credentials':
      return { code, message: 'Incorrect email or password.' }
    case 'email_not_confirmed':
      return { code, message: 'Please confirm your email first. Check your inbox for the link.' }
    case 'user_already_exists':
    case 'email_exists':
      return { code, message: 'An account with this email already exists. Sign in instead.' }
    case 'weak_password':
      return { code, message: 'That password is too weak. Use at least 8 characters with a letter and a number.' }
    case 'same_password':
      return { code, message: 'Your new password must be different from the old one.' }
    case 'over_email_send_rate_limit': {
      // Two different limits share this code:
      // - per-address cooldown: "you can only request this after 26 seconds"
      // - project-wide hourly cap of the built-in mailer: "email rate limit exceeded"
      const secs = raw.match(/after (\d+) seconds?/)
      if (secs) {
        const retryAfter = Number(secs[1])
        return { code, retryAfter, message: `Please wait ${retryAfter} seconds before requesting another email.` }
      }
      return {
        code,
        message:
          "We can't send more emails right now (hourly sending limit reached). Please try again in up to an hour. " +
          'If you remember your password, you can sign in now.',
      }
    }
    case 'over_request_rate_limit':
      return { code, message: 'Too many attempts. Please wait a minute and try again.' }
    case 'email_address_invalid':
      return { code, message: 'That email address looks invalid.' }
    case 'otp_expired':
      return { code, message: 'This link has expired. Request a new one.' }
    case 'session_not_found':
    case 'session_expired':
      return { code, message: 'Your session expired. Please request a new link.' }
    default:
      return { code, message: raw || 'Something went wrong. Please try again.' }
  }
}
