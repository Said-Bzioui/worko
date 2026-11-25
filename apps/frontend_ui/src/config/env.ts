export const env = {
  appName: import.meta.env.VITE_APP_NAME || 'WORKFLOW PRO',
  apiBaseUrl: import.meta.env.DEV ? '/api/v1' : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1`,
  backendOrigin: import.meta.env.VITE_API_URL || 'http://localhost:3000',
} as const;
