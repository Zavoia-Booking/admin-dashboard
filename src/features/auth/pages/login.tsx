import { LoginForm } from "../components/login-form"

/**
 * Thin alias for the splash preloader (`SplashGate.tsx` imports this path).
 * The /login route element is `<LoginForm />` rendered into AuthLayout's
 * Outlet — this file just keeps the existing chunk import path stable.
 */
export default function LoginPage() {
  return <LoginForm />
}
