const API_BASE = (typeof window !== 'undefined' && window.location.origin && !window.location.origin.startsWith('file:'))
  ? (window.location.port === '5173' ? 'http://localhost:5000' : window.location.origin)
  : 'http://localhost:5000';

/**
 * Call POST /api/auth/sync to synchronize Firebase user with Supabase PostgreSQL users table.
 * Matches backend/src/controllers/authController.js -> syncUser()
 *
 * @param {string} idToken
 * @param {object} [extra] { full_name, role, profile_picture }
 */
export async function syncUserWithBackend(idToken, extra = {}) {
  const response = await fetch(`${API_BASE}/api/auth/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify(extra),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to sync user with server (${response.status})`);
  }

  const data = await response.json();
  if (data && data.user) {
    localStorage.setItem('fg_token', idToken);
    localStorage.setItem('fg_user', JSON.stringify(data.user));
  }
  return data;
}

/**
 * Get authenticated user profile from backend GET /api/auth/me
 * @param {string} idToken
 */
export async function fetchCurrentUserProfile(idToken) {
  const response = await fetch(`${API_BASE}/api/auth/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch user profile (${response.status})`);
  }

  return response.json();
}

/**
 * Format Firebase Auth Error codes into friendly user messages.
 */
export function friendlyAuthError(error) {
  const code = error?.code || '';
  const map = {
    'auth/user-not-found': 'No FleetGuard account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/email-already-in-use': 'An account with this email address already exists.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/too-many-requests': 'Too many unsuccessful attempts. Please try again later.',
    'auth/network-request-failed': 'Network connection error. Please check your internet.',
    'auth/popup-closed-by-user': 'Google sign-in popup was closed before completion.',
    'auth/popup-blocked': 'Sign-in popup was blocked by browser. Please allow popups.',
    'auth/cancelled-popup-request': 'Sign-in request was cancelled.',
    'auth/invalid-credential': 'Invalid credentials. Please verify your email and password.',
    'auth/user-disabled': 'This account has been disabled. Please contact your Fleet Manager.',
    'auth/operation-not-allowed': 'This sign-in method is currently disabled.',
  };

  return map[code] || error.message || 'An unexpected error occurred during authentication.';
}
