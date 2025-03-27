import { AuthGuard } from "@/guards/AuthGuard";
import WebRequest from "@/helpers/api/WebRequest";
import "@/styles/globals.css";
import { createContext, useContext, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { RootStore, initializeStore } from "@/stores/rootStore";
import { observer } from "mobx-react-lite";
import { runInAction } from "mobx";

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
  const [isMounted, setIsMounted] = useState(false);
  
  // Get or create the store on client-side
  const [appStore] = useState(() => getOrCreateStore());

  // Client-side only code
  useEffect(() => {
    setIsMounted(true);
    
    const checkAuth = async () => {
      // Make sure loading state is set to true at the beginning
      runInAction(() => {
        appStore.authStore.isLoading = true;
      });
      
      try {
        // Check if we have a token
        const authToken = localStorage.getItem('authToken');
        if (authToken) {
          WebRequest.SetAccessToken(authToken);
          
          try {
            // Set a timeout for the auth check
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Auth check timeout')), 5000);
            });
            
            // Race the auth check against the timeout
            await Promise.race([
              appStore.authStore.checkAuth(),
              timeoutPromise
            ]);
            
            // If we get here, checkAuth completed successfully
            console.log("Auth check completed successfully");
          } catch (error) {
            console.error("Auth check failed or timed out:", error);
            
            // Explicitly handle timeout or auth check failure
            runInAction(() => {
              appStore.authStore.user = null;
              appStore.authStore.isAuthenticated = false;
              appStore.authStore.isLoading = false;
            });
            
            // Clear token on error
            localStorage.removeItem('authToken');
          }
        } else {
          console.log("No auth token found, setting unauthenticated state");
          // No token, make sure we're marked as not authenticated
          runInAction(() => {
            appStore.authStore.user = null;
            appStore.authStore.isAuthenticated = false;
            appStore.authStore.isLoading = false;
          });
        }
      } catch (error) {
        console.error("Unexpected error in auth check:", error);
        runInAction(() => {
          appStore.authStore.user = null;
          appStore.authStore.isAuthenticated = false;
          appStore.authStore.isLoading = false;
        });
      }
    };
    
    if (typeof window !== 'undefined') {
      checkAuth();
    } else {
      runInAction(() => {
        appStore.authStore.isLoading = false;
      });
    }
  }, [appStore.authStore]);

  // Handle server-side rendering - don't attempt authentication
  if (!isMounted) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  console.log("App render - authStore.isLoading:", appStore.authStore.isLoading);

  // This runs only on client side
  return (
    <StoreContext.Provider value={appStore}>
      {Component.requireAuth ? (
        <AuthGuard requiredRoles={Component.requiredRoles || []}>
          <Component {...pageProps} />
        </AuthGuard>
      ) : (
        <Component {...pageProps} />
      )}
      <Toaster position="top-right" />
    </StoreContext.Provider>
  );
});

export default App;
