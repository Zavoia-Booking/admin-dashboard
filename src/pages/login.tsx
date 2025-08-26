import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { LoginForm } from "../components/login-form"
import { useDispatch, useSelector } from "react-redux";
import { loginAction } from "../store/auth/actions";

export default function LoginPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch();
  // const { authStore } = useStores()
  // const { isAuthenticated, isLoading } = authStore

  const mainState: any = useSelector((state: any) => state.auth);

  console.log('mainState', mainState)

  console.log('test', mainState)
  useEffect(() => {
    dispatch(loginAction())
  },[dispatch]);

  // TODO
  const { isAuthenticated, isLoading } = {isAuthenticated: true, isLoading: true}


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

// No authentication required for login page
LoginPage.requireAuth = false; 