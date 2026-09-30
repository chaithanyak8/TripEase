// TripEase Centralized API Configuration
// Resolves API URLs in production (Netlify serverless / relative / custom backend)
// and development (local proxy / localhost:5000)

const rawApiUrl = import.meta.env.VITE_API_URL;

// If VITE_API_URL is specified (e.g. external backend), use it.
// Otherwise in production on Netlify or with Vite proxy, use relative path ('').
export const API_BASE_URL = (rawApiUrl || '').replace(/\/+$/, '');

export const apiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};

export default apiUrl;
