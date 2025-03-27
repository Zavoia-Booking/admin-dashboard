import WebApi from '@/helpers/api/WebApi';
import WebRequest from '@/helpers/api/WebRequest';
import { makeAutoObservable, runInAction, action } from 'mobx';
import { UserRole } from '@/types/auth';
import { log } from 'console';

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
      setRedirect: action.bound
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

  // Actions
  login = async (email: string, password: string) => {
    try {
      this.isLoading = true;
      this.error = null;
      
      const { response, data }: any = await WebRequest.POST(WebApi.auth.loginRequest(), { email, password });
      console.log('data', data);
      
      if ([200, 201].includes(response.status)) {
        // Use runInAction to batch updates for better performance
        runInAction(() => {
          localStorage.setItem('authToken', data.auth_token);
          this.user = data.user;
          this.isAuthenticated = true;
          this.isLoading = false; // Reset loading state before redirect
        });
        
        // Redirect to the saved redirect path or dashboard by default
        const redirectPath = localStorage.getItem('authRedirect') || '/dashboard';
        localStorage.removeItem('authRedirect'); // Clear after use
        window.location.href = redirectPath;
      } else {
        // Handle non-success status codes
        runInAction(() => {
          this.error = data?.message || 'Login failed. Please try again.';
          this.isLoading = false; // Reset loading state
        });
      }
    } catch (error) {
      console.error('Login failed:', error);
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Login failed';
        this.isLoading = false; // Reset loading state
      });
    }
  }

  logout = async () => {
    try {
      this.isLoading = true;
      this.error = null;
      
      const { response }: any = await WebRequest.POST(WebApi.auth.logoutRequest(), {});

      if ([200, 201].includes(response.status)) {
        // Use runInAction to batch updates for better performance
        runInAction(() => {
          localStorage.removeItem('authToken');
          this.user = null;
          this.isAuthenticated = false;
          this.isLoading = false; // Reset loading state before redirect
        });
        window.location.href = '/login';
      } else {
        // Handle non-success status codes
        runInAction(() => {
          this.error = 'Logout failed. Please try again.';
          this.isLoading = false; // Reset loading state
        });
      }
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'An error occurred';
        this.isLoading = false; // Reset loading state
      });
    }
  }

  checkAuth = async () => {
    try {
      this.isLoading = true;
      this.error = null;
      
      const { response, data }: any = await WebRequest.GET(WebApi.auth.getCurrentUser());
      
      if ([200].includes(response.status)) {
        runInAction(() => {
          this.user = data;
          this.isAuthenticated = true;
          this.isLoading = false; // Reset loading state
        });
      } else {
        runInAction(() => {
          this.user = null;
          this.isAuthenticated = false;
          this.isLoading = false; // Reset loading state
        });
        throw new Error('Not authenticated');
      }
    } catch (error) {
      runInAction(() => {
        this.user = null;
        this.isAuthenticated = false;
        this.error = error instanceof Error ? error.message : 'An error occurred';
        this.isLoading = false; // Reset loading state
      });
      
      // If we get a 401 unauthorized error, clear any existing token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
      }
    }
  }

  // New helper method to register and auto-login
  register = async (userData: {
    firstName: string,
    lastName: string,
    phone: string,
    email: string,
    password: string,
    role: UserRole
  }) => {
    try {
      this.isLoading = true;
      this.error = null;
      
      const { response, data }: any = await WebRequest.POST(WebApi.auth.registerRequest(), userData);
      
      if ([200, 201].includes(response.status) && data.auth_token) {
        runInAction(() => {
          localStorage.setItem('authToken', data.auth_token);
          WebRequest.SetAccessToken(data.auth_token);
          this.user = data.user;
          this.isAuthenticated = true;
          this.isLoading = false; // Reset loading state
        });
        
        return { success: true };
      } else {
        runInAction(() => {
          this.error = data.message || "Registration failed. Please try again.";
          this.isLoading = false; // Reset loading state
        });
        return { success: false, message: data.message };
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      runInAction(() => {
        this.error = error.message || "Registration failed. Please try again.";
        this.isLoading = false; // Reset loading state
      });
      return { success: false, message: error.message };
    }
  }
} 