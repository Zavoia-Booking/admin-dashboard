import WebApi from '@/helpers/api/WebApi';
import WebRequest from '@/helpers/api/WebRequest';
import { makeAutoObservable, runInAction, action } from 'mobx';
import { UserRole } from '@/types/auth';
import { NextRouter } from 'next/router';

// Add router import and instance
let router: NextRouter;

// Method to initialize router
export const initAuthRouter = (nextRouter: NextRouter) => {
  router = nextRouter;
};

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  businessId?: string; // For specialists and clients
}

// Default development user with admin role
const devUser: User = {
  id: 'dev-admin',
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  role: UserRole.ADMIN,
  businessId: 'business-1'
};

export class AuthStore {
  // Initialize with dev user for development
//   user: User | null = devUser;
  user: User | null = null;
  isLoading: boolean = false;
  error: string | null = null;
  isAuthenticated = false;
  redirect: string = '/';

  constructor() {
    makeAutoObservable(this, {
      // Mark actions explicitly to optimize performance
      login: action.bound,
      logout: action.bound,
      checkAuth: action.bound,
      register: action.bound,
      setRedirect: action.bound,
      setAuthData: action.bound,
      clearAuthData: action.bound
    }, { autoBind: true });
  }

  // Simple state setters
  setUser(user: User | null) {
    this.user = user;
  }

  setLoading(loading: boolean) {
    this.isLoading = loading;
  }

  setError(error: string | null) {
    this.error = error;
  }

  setRedirect(redirect: string) {
    this.redirect = redirect;
  }

  setAuthenticated(authenticated: boolean) {
    this.isAuthenticated = authenticated;
  }

  // Centralized methods for managing auth state
  setAuthData(token: string, user: User) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
      WebRequest.SetAccessToken(token);
    }
    
    runInAction(() => {
      this.user = user;
      this.isAuthenticated = true;
      this.isLoading = false;
      this.error = null;
    });
  }

  clearAuthData() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      WebRequest.SetAccessToken('');
    }
    
    runInAction(() => {
      this.user = null;
      this.isAuthenticated = false;
      this.isLoading = false;
      this.error = null;
    });
  }

  // Actions
  login = async (email: string, password: string): Promise<boolean> => {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });
      
      const { response, data }: any = await WebRequest.POST(WebApi.auth.loginRequest(), { email, password });
      
      if ([200, 201].includes(response.status)) {
        // Set auth data in one centralized place
        this.setAuthData(data.auth_token, data.user);
        
        // Get redirect path
        const redirectPath = localStorage.getItem('authRedirect') || '/dashboard';
        localStorage.removeItem('authRedirect'); // Clear after use
        
        // Direct navigation - only if router is available
        if (router) {
          router.push(redirectPath);
        }
        
        return true;
      } else {
        // Handle non-success status codes
        runInAction(() => {
          this.error = data?.message || 'Login failed. Please try again.';
          this.isLoading = false;
        });
        return false;
      }
    } catch (error) {
      console.error('Login failed:', error);
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Login failed';
        this.isLoading = false;
      });
      return false;
    }
  }

  logout = async (): Promise<boolean> => {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });
      
      const { response }: any = await WebRequest.POST(WebApi.auth.logoutRequest(), {});

      if ([200, 201].includes(response.status)) {
        // Use centralized method to clear auth data
        this.clearAuthData();
        
        // Direct navigation
        if (router) {
          router.push('/login');
        }
        
        return true;
      } else {
        // Handle non-success status codes
        runInAction(() => {
          this.error = 'Logout failed. Please try again.';
          this.isLoading = false;
        });
        return false;
      }
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'An error occurred';
        this.isLoading = false;
      });
      return false;
    }
  }

  checkAuth = async (): Promise<boolean> => {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });
      
      const { response, data }: any = await WebRequest.GET(WebApi.auth.getCurrentUser());
      
      if ([200].includes(response.status)) {
        // Use centralized method to set auth data (without token since we're just verifying)
        runInAction(() => {
          this.user = data;
          this.isAuthenticated = true;
          this.isLoading = false;
        });
        return true;
      } else {
        this.clearAuthData();
        throw new Error('Not authenticated');
      }
    } catch (error) {
      this.clearAuthData();
      return false;
    }
  }

  // Register and auto-login
  register = async (userData: {
    firstName: string,
    lastName: string,
    phone: string,
    email: string,
    password: string,
    role: UserRole
  }): Promise<boolean> => {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });
      
      const { response, data }: any = await WebRequest.POST(WebApi.auth.registerRequest(), userData);
      
      if ([200, 201].includes(response.status) && data.auth_token) {
        // Use centralized method to set auth data
        this.setAuthData(data.auth_token, data.user);
        
        // Direct navigation
        if (router) {
          router.push('/dashboard');
        }
        
        return true;
      } else {
        runInAction(() => {
          this.error = data.message || "Registration failed. Please try again.";
          this.isLoading = false;
        });
        return false;
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      runInAction(() => {
        this.error = error.message || "Registration failed. Please try again.";
        this.isLoading = false;
      });
      return false;
    }
  }
} 