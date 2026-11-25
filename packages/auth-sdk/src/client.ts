import { createAuthClient } from 'better-auth/react';
import type {
  AuthClientOptions,
  SignInEmailInput,
  SignInSocialInput,
  SignUpEmailInput,
} from './types.js';

export function createWorkoAuthClient(options: AuthClientOptions = {}) {
  const client = createAuthClient({
    baseURL: options.baseURL,
    basePath: options.basePath ?? '/api/auth',
    fetchOptions: {
      credentials: 'include',
    },
  });

  return {
    client,
    useSession: client.useSession,
    getSession: () => client.getSession(),
    signInWithEmail: (input: SignInEmailInput) => client.signIn.email(input),
    signUpWithEmail: (input: SignUpEmailInput) => client.signUp.email(input),
    signInWithSocial: (input: SignInSocialInput) => client.signIn.social(input),
    signOut: () => client.signOut(),
  };
}

export type WorkoAuthClient = ReturnType<typeof createWorkoAuthClient>;
