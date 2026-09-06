// Vite substitutes these values when building the frontend.
// Production works on Vercel without requiring a new environment variable.
const defaultBaseUrl = import.meta.env.DEV
  ? 'http://localhost:5000'
  : 'https://ems-system-qpv1.onrender.com';

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL?.trim() || defaultBaseUrl
).replace(/\/+$/, '');
