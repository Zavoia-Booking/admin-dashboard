import { useEffect } from "react"
import { useRouter } from "next/router"

export default function IndexPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard
    router.replace("/dashboard")
  }, [router])

  // Loading state shown while redirecting
  return (
    <div className="flex min-h-svh items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
}

// No authentication required for the index redirect
IndexPage.requireAuth = false;
