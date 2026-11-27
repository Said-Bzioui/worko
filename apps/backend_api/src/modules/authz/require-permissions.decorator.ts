import { SetMetadata } from '@nestjs/common';
import type { PermissionKey } from './rbac.constants.js';

export const PERMISSIONS_KEY = 'worko:required_permissions';

export const RequirePermissions = (...permissions: PermissionKey[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
