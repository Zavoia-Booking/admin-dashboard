import { useStores } from '@/pages/_app';

export const useUserStore = () => {
  const { userStore } = useStores();
  
  return {
    user: userStore.user,
    isLoading: userStore.isLoading,
    isAuthenticated: userStore.isAuthenticated,
    error: userStore.error,
    login: userStore.login,
    logout: userStore.logout,
    checkAuth: userStore.checkAuth,
    setRedirect: userStore.setRedirect,
  };
}; 