import axios, { AxiosError } from "axios";
import config from "../../app/config/env";

export const http = axios.create({
  baseURL: config.API_URL,
});

http.interceptors.request.use((requestConfig) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    requestConfig.headers = requestConfig.headers || {};
    requestConfig.headers['Authorization'] = `Bearer ${token}`;
  }
  return requestConfig;
});

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    const message = (error.response?.data as any)?.message || error.message || 'Request failed';
    return Promise.reject(new Error(Array.isArray(message) ? message.join(', ') : message));
  }
);

export default http;


