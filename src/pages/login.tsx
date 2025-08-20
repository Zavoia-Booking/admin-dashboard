import { useEffect } from "react"
import { useRouter } from "next/router"
import { LoginForm } from "@/components/login-form"
import {useDispatch, useSelector} from "react-redux";
import {loginAction} from "@/slices/auth/actions";

export default function LoginPage() {
  const router = useRouter()
  const dispatch = useDispatch();

  // const { authStore } = useStores()
  // const { isAuthenticated, isLoading } = authStore

  const mainState: any = useSelector((state: any) => state.auth);

  console.log('test', mainState)
  useEffect(() => {
    dispatch(loginAction())
  },[dispatch]);

  // TODO
  const { isAuthenticated, isLoading } = {isAuthenticated: true, isLoading: true}


  useEffect(() => {

    // If already authenticated, redirect to dashboard or saved path
    if (!isLoading && isAuthenticated) {
      const redirectPath = localStorage.getItem('authRedirect') || '/dashboard'
      localStorage.removeItem('authRedirect') // Clear after use
      router.push(redirectPath)
    }
  }, [isLoading, isAuthenticated, router])

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