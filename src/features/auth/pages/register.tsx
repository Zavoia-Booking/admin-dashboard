import { RegisterForm } from "../components/register-form"

/**
 * Renders the form-side content of the /register route. The persistent
 * shell (AuthShell + AuthCard + AuthHero + toggle + heading) is provided
 * by AuthLayout, so this component only emits the registration form —
 * the same on web and in the native apps.
 */
export default function RegisterPage() {
  return <RegisterForm />
}
