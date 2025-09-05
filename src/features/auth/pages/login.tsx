import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { LoginForm } from "../components/login-form"
import { useSelector } from "react-redux";
import type { RootState } from "../../../app/providers/store";

export default function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const redirectPath = localStorage.getItem('authRedirect') || '/dashboard'
      localStorage.removeItem('authRedirect')
      navigate(redirectPath, { replace: true })
    }
  }, [isLoading, isAuthenticated, navigate])

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <LoginForm />
      </div>
    </div>
  )
}
