import { AuthGuard } from "@/guards/AuthGuard";
import WebApi from "@/helpers/api/WebApi";
import WebRequest from "@/helpers/api/WebRequest";
import "@/styles/globals.css";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";

export default function App({ Component, pageProps: { session, ...pageProps } }: any) {
  const [data, setData] = useState({
    user: null,
    isAuthenticated: false,
  });
  const [redirect, setRedirect] = useState('/');

  const [loading, setLoading] = useState(true);

  const autoLogin = async () => {
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      WebRequest.SetAccessToken(authToken);
      const currentUserRequest: any = await WebRequest.GET(WebApi.auth.getCurrentUser());
      if ([200].includes(currentUserRequest.response.status))
        setData({
          user: currentUserRequest.data,
          isAuthenticated: true
        })
    }
    setLoading(false);
  }

  useEffect(() => {
    autoLogin()
  }, [])

  if (loading && Component.requireAuth) {
    return null
  }

  return (
    <>
      {Component.requireAuth ? (
        <AuthGuard requiredRoles={Component.requiredRoles}>
          <Component {...pageProps} />
          <Toaster />
        </AuthGuard>
      ) : (
        <Component {...pageProps} />
      )}
    </>
  );
}
