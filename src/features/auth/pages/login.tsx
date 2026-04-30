import { LoginForm } from "../components/login-form"
import wordmarkUrl from "../../../assets/zavoia_logo_primary_wordmark_transparent.svg"

export default function LoginPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl flex flex-col items-center gap-6">
        <img
          src={wordmarkUrl}
          alt="Zavoia"
          className="splash-target-wordmark h-10 md:h-14 w-auto"
        />
        <div className="splash-target-card w-full">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
