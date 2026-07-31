# Capacitor Register Flow — Design Notes (2026-07-03)

Status: **designed, not implemented**. Come back to this doc before starting work.

## Product decision (context)

The admin-dashboard Capacitor build will be listed in the App Store / Play Store as a
"read-only / use-only" app to avoid store payment fees.

- **Login on native**: works as normal, unchanged.
- **Register on native**: email-only form → we email a link → user finishes registration **on web**
  (so they see billing/payment options there and learn "that stuff happens on web").
- **Hard constraint**: the app UI may NOT mention web, browsers, payments, or subscriptions.
  The *email* may mention web; the in-app copy may not.
- Web register/login flows stay completely untouched.

## What already exists (verified in code, 2026-07-03)

The email→web funnel is already built end-to-end:

| Piece | Where |
|---|---|
| Native branch on register page | `admin-dashboard/src/features/auth/pages/register.tsx:57` — `isNative` → renders `MobileRegisterEmailForm` |
| Email-only mobile form (states: `form`, `sent`, `account_exists`) | `admin-dashboard/src/features/auth/components/MobileRegisterEmailForm.tsx` |
| Request endpoint | `POST /auth/mobile-register-request` (`admin-api/src/modules/auth/auth.controller.ts:892`, `EmailSendRateLimitGuard` 3/15min) |
| Token | `MOBILE_REGISTER_INVITE` in `verification_token` — 24h TTL, single-use, SHA-256 hashed, `user=null`, email in `metadata` |
| Email template | `admin-api/src/emails/templates/MobileRegisterInvite.ts` → links `${FRONTEND_URL}/register?welcomeToken=...` |
| Web landing | web `/register` validates via `GET /auth/mobile-register-validate` (controller:943), pre-fills + locks email |
| Pre-verified register | `POST /auth/register-business-owner` accepts `welcomeToken` → `emailPreVerified=true`, skips verification email, auto-login → `/welcome` wizard |

Native session plumbing is also solved: refresh token in `@capacitor/preferences`
(`tokenStorage.ts`), `X-Native-App: capacitor` header, body-based refresh (`http.ts`).
Backend buckets these sessions into the `mobile` platform slot (`auth.service.ts` `detectPlatform`).

## The gap — existing accounts (the only new build work)

Today `mobile-register-request` hard-rejects an existing email with 409 `AUTH.E33`, and the
mobile form shows a "go to login" CTA. Desired: **ask for the password in-app; on success add
the OWNER role directly on native** — no email, no web redirect for this branch.

The upgrade primitive already exists inside `POST /auth/link-business-account`
(controller:1216): `createUserRole(user, null, OWNER)` + `createBusinessOwner` +
`update({wizardCompleted:false, email_verified:true})` + auto-login. It's just gated by an
email token today instead of a password.

### Backend changes

1. `POST /auth/mobile-register-request` — return a discriminated signal instead of bare 409:
   - `email_sent` — new email; existing behavior (send `MOBILE_REGISTER_INVITE` email).
   - `password_required` — account exists and has a password (customer / team member / owner).
   - Google-only account (no password): respond `email_sent` and instead send the existing
     `BUSINESS_ACCOUNT_LINK` email (`send-business-link-email` internals) — lands on web,
     indistinguishable from the new-user path from the app's perspective.
2. New endpoint `POST /auth/mobile-register-existing` `{ email, password }`:
   - Same anti-timing order as `/auth/login` (Google-only check BEFORE password verify — controller:643).
   - `verifyPassword` → generic error on failure (mirror the marketplace E38 convention: never
     reveal wrong-password vs Google-only).
   - Already OWNER → just log them in (normal login response).
   - Customer/team-member → run the link-business-account primitive above, then `newAuthToken`.
   - Rate-limit like login (note: `LoginRateLimitGuard` on `/auth/login` is currently commented out).

### Frontend changes (admin-dashboard)

1. `MobileRegisterEmailForm`: add a `password` state alongside `form`/`sent`/`account_exists`.
   On `password_required` → show password input; submit → new endpoint → store tokens exactly
   like the login saga (native refresh persistence already handled) → route to `/welcome`.
2. New api fn + saga in `src/features/auth/` following the existing login/register saga patterns.

## Decisions made / to confirm

- **Email enumeration**: password-prompt branching reveals account existence. Accepted — the
  current 409 CTA already leaks it and it matches normal login UX. Keep failed-password errors generic.
- **Google-only accounts**: no in-app password possible; fall back to `BUSINESS_ACCOUNT_LINK`
  email → web. Do NOT build native Google auth for v1.
- **Copy fix needed**: current success string (`locales/en/auth.json` ~210) says
  *"Open it in a browser to finish creating your account"* — violates the no-web-mention
  constraint. Change to e.g. "Check your email to continue setting up your account." (en + ro)
- **Post-upgrade wizard on native**: upgraded users land in `/welcome` setup wizard ON NATIVE
  (emailed users hit it on web). Verify the wizard degrades gracefully — StepTeam is
  seat/subscription-gated and billing is web-only-gated on native.
- **Login path has the same edge**: `/auth/login` with a customer-only account throws 409
  `account_exists_needs_business_owner_account` (controller:674); web opens the linking modal.
  On native, route this into the same password-verified upgrade instead (password already proven).
- **Deep links: intentionally none.** Nothing configured (`@capacitor/app` not installed, no
  intent filters) and the product decision wants email links to land on web. Feature, not gap.

## Native Google auth (RESOLVED 2026-07-31)

The "dead Google button on native login" bug is fixed — native Google auth now works via
`@capgo/capacitor-social-login` (Credential Manager account picker, no webview OAuth, no
deep links) and a dedicated backend endpoint:

- `nativeGoogleSignIn()` (`src/features/auth/lib/nativeGoogleAuth.ts`) initializes the plugin
  with `VITE_GOOGLE_CLIENT_ID` as the web/server client id and returns a Google **ID token**.
- `GoogleSignInButton` branches on `usePlatform().isNative`: web keeps the auth-code redirect
  flow, native posts the ID token through the same `googleLoginAction`/`googleRegisterAction`
  sagas (payload union `{code, redirectUri} | {idToken}`).
- Backend: `POST /auth/google/native` (`{ idToken, intent: 'login'|'register', locale? }`).
  **Register intent never creates the account** — it feeds the same email funnel as
  `/mobile-register-request` (invite metadata records `provider: 'google' + googleSub`; the
  web form shows a "finish with Google" hint via `mobile-register-validate`'s `provider`
  field, and the account's googleSub always comes from the fresh web sign-in, never from the
  token). Known linked owners are simply logged in; unlinked collisions reuse the in-app
  password-re-auth modal; login intent mirrors the `POST /auth/google` decision tree.
- Setup prerequisite: an **Android OAuth client** must exist in the same Google Cloud
  project for each package + signing-cert combination. NOTE the `staging` product flavor
  appends `.staging`, so staging builds are `com.zavoia.admin.staging` (production builds
  are `com.zavoia.admin`). Get the real signing SHA-1 from **Logcat tag `GoogleProvider`**
  (the plugin logs the running app's package + signingSha1 on every attempt) — that is
  ground truth for the installed build. Beware: APKs found in the project's build/ folder
  can be stale WSL-built artifacts signed with the WSL keystore (sync script now strips
  them). Windows Android Studio deploys are signed by `C:\Users\<user>\.android\debug.keystore`.
  Mobile env files must define `VITE_GOOGLE_CLIENT_ID` (the *web* client id).

## Implementation checklist (when resuming)

- [ ] Backend: discriminated response on `mobile-register-request` (+ Google-only → business-link email)
- [ ] Backend: `POST /auth/mobile-register-existing` (password-verified OWNER upgrade / login)
- [ ] Backend: message codes for new responses (follow `MessageCodes.AUTH.*` convention)
- [ ] Frontend: password step in `MobileRegisterEmailForm` + api + saga + token storage
- [ ] Frontend: native login 409 `account_exists_needs_business_owner_account` → same upgrade path
- [ ] Frontend: gate `GoogleSignInButton` off on native
- [ ] Copy: replace "open it in a browser" string (en + ro)
- [ ] QA: `/welcome` wizard on native for upgraded users
- [ ] QA: rate limits + generic errors (enumeration/timing) on the new endpoint
