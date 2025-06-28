import { AuthGuard } from "@/guards/AuthGuard";
import WebRequest from "@/helpers/api/WebRequest";
import "@/styles/globals.css";
import { createContext, useContext, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { RootStore, initializeStore } from "@/stores/rootStore";
import { observer } from "mobx-react-lite";
import { runInAction } from "mobx";
import { useRouter } from "next/router";
import { initAuthRouter } from "@/stores/authStore";

// Create the store outside of the render cycle
let store: RootStore;

// Initialize the store once during app boot
function getOrCreateStore() {
  if (!store) {
    store = initializeStore();
  }
  return store;
}

const StoreContext = createContext<RootStore | null>(null);

export const useStores = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("StoreProvider is missing");
  }
  return context;
};

const App = observer(({ Component, pageProps }: any) => {
  const [mounted, setMounted] = useState(false);
  const [appStore] = useState(() => getOrCreateStore());
  const router = useRouter();

  useEffect(() => {
    // Initialize the router for auth store
    // initAuthRouter(router);
    
    setMounted(true);
    
    // Commented out for development - skip authentication check
    // const checkAuth = async () => {
    //   // Skip if already authenticated
    //   if (appStore.authStore.isAuthenticated && appStore.authStore.user) {
    //     console.log("_app: Already authenticated, skipping auth check");
    //     runInAction(() => {
    //       appStore.authStore.isLoading = false;
    //     });
    //     return;
    //   }
      
    //   // Check if we have a token
    //   const authToken = localStorage.getItem('authToken');
      
    //   if (!authToken) {
    //     console.log("_app: No auth token found");
    //     // No need to call clearAuthData since we're just initializing
    //     runInAction(() => {
    //       appStore.authStore.user = null;
    //       appStore.authStore.isAuthenticated = false;
    //       appStore.authStore.isLoading = false;
    //     });
    //     return;
    //   }
      
    //   // We have a token, set it and check authentication
    //   console.log("_app: Found token, verifying...");
    //   WebRequest.SetAccessToken(authToken);
      
    //   try {
    //     // Let the auth store handle the check and state updates
    //     const isAuthenticated = await appStore.authStore.checkAuth();
    //     console.log("_app: Auth check result:", isAuthenticated);
        
    //     // No need to manually update state as checkAuth does that for us
    //   } catch (error) {
    //     console.error("_app: Auth check failed:", error);
    //     // The checkAuth method will clear auth data if it fails
    //   }
    // };
    
    // Run auth check only on client side
    // if (typeof window !== 'undefined') {
    //   checkAuth();
    // } else {
    //   runInAction(() => {
    //     appStore.authStore.isLoading = false;
    //   });
    // }
  }, [appStore.authStore, router]);

  // For server-side rendering, show a simple loader
  if (!mounted) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Client-side rendering without authentication (commented out for development)
  return (
    <StoreContext.Provider value={appStore}>
      {/* Commented out for development - bypass authentication */}
      {/* {Component.requireAuth ? (
        <AuthGuard requiredRoles={Component.requiredRoles || []}>
          <Component {...pageProps} />
        </AuthGuard>
      ) : (
        <Component {...pageProps} />
      )} */}
      <Component {...pageProps} />
      <Toaster position="top-right" />
    </StoreContext.Provider>
  );
});

export default App;
