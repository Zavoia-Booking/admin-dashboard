import { AuthGuard } from "@/guards/AuthGuard";
import WebRequest from "@/helpers/api/WebRequest";
import "@/styles/globals.css";
import { createContext, useContext, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { RootStore, initializeStore } from "@/stores/rootStore";

let store: RootStore;

const StoreContext = createContext<RootStore | null>(null);

export const useStores = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("StoreProvider is missing");
  return context;
};

export default function App({ Component, pageProps: { session, ...pageProps } }: any) {
  store = initializeStore();
  const [loading, setLoading] = useState(true);

  return (
    <StoreContext.Provider value={store}>
      <AppContent Component={Component} pageProps={pageProps} loading={loading} setLoading={setLoading} />
    </StoreContext.Provider>
  );
}

function AppContent({ Component, pageProps, loading, setLoading }: any) {
  const store = useStores();

  useEffect(() => {
    const autoLogin = async () => {
      const authToken = localStorage.getItem('authToken');
      if (authToken) {
        WebRequest.SetAccessToken(authToken);
        await store.userStore.checkAuth();
      }
      setLoading(false);
    };
    
    autoLogin();
  }, []);

  if (loading && Component.requireAuth) {
    return null;
  }

  return Component.requireAuth ? (
    <AuthGuard requiredRoles={Component.requiredRoles}>
      <Component {...pageProps} />
      <Toaster />
    </AuthGuard>
  ) : (
    <Component {...pageProps} />
  );
}
