import type { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  image: string | null;
  emailVerified: boolean;
}

export interface AuthenticatedSession {
  id: string;
  expiresAt: Date;
}

export interface TenantContext {
  organizationId?: string;
  workspaceId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  session?: AuthenticatedSession;
  tenantContext?: TenantContext;
}
