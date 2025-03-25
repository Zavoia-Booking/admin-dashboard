import WebApi from '@/helpers/api/WebApi';
import WebRequest from '@/helpers/api/WebRequest';
import { makeAutoObservable } from 'mobx';
import { UserRole } from '@/types/auth';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  businessId?: string; // For specialists and clients
}

export class UserStore {
  user: User | null = null;
  isLoading: boolean = false;
  error: string | null = null;
  isAuthenticated = false;
  redirect: string = '/';

  constructor() {
    makeAutoObservable(this);
  }

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
      this.setLoading(true);
      this.setError(null);
      
      const { response, data }: any = await WebRequest.POST(WebApi.auth.loginRequest(), { email, password });
      
      if ([200, 201].includes(response.status)) {
        localStorage.setItem('authToken', data.auth_token);
        this.setUser(data);
        this.setAuthenticated(true);
        window.location.href = this.redirect;
        this.setRedirect('/dashboard');
      }
    } catch (error) {
      console.error('Login failed:', error);
      this.setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      this.setLoading(false);
    }
  };

  logout = async () => {
    try {
      this.setLoading(true);
      this.setError(null);
      
      const { response }: any = await WebRequest.POST(WebApi.auth.logoutRequest(), {});

      if ([200, 201].includes(response.status)) {
        localStorage.removeItem('authToken');
        this.setUser(null);
        this.setAuthenticated(false);
        window.location.href = '/';
      }
    } catch (error) {
      this.setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      this.setLoading(false);
    }
  };

  checkAuth = async () => {
    try {
      this.setLoading(true);
      this.setError(null);
      
      const { response, data }: any = await WebRequest.GET(WebApi.auth.getCurrentUser());
      
      if ([200].includes(response.status)) {
        this.setUser(data);
        this.setAuthenticated(true);
      } else {
        throw new Error('Not authenticated');
      }
    } catch (error) {
      this.setUser(null);
      this.setAuthenticated(false);
      this.setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      this.setLoading(false);
    }
  };
}