import { createWorkoAuthClient } from '@worko/auth-sdk';

export const authClient = createWorkoAuthClient({
  baseURL: import.meta.env.DEV
    ? undefined
    : import.meta.env.VITE_API_URL || 'http://localhost:3000',
});
