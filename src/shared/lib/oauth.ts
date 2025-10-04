export function getGoogleRedirectUri(): string {
  return import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/callback`;
}

export function setOauthContext(context: 'login' | 'register' | 'link') {
  try { sessionStorage.setItem('oauthContext', context); } catch {}
}


