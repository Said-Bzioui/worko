export type SocialProvider = 'github' | 'google';

export interface SignInEmailInput {
  email: string;
  password: string;
  rememberMe?: boolean;
  callbackURL?: string;
}

export interface SignUpEmailInput {
  email: string;
  password: string;
  name: string;
  callbackURL?: string;
}

export interface SignInSocialInput {
  provider: SocialProvider;
  callbackURL?: string;
  errorCallbackURL?: string;
}

export interface AuthClientOptions {
  /**
   * Backend origin (e.g. "http://localhost:3000").
   * When omitted in the browser, Better Auth uses the current origin + "/api/auth".
   */
  baseURL?: string;
  /**
   * Auth mount path on the backend. Defaults to "/api/auth".
   */
  basePath?: string;
}
