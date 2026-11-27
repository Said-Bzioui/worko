import { RoleScope } from '@worko/database';

export const PERMISSIONS = {
  ORGANIZATION_READ: 'organization:read',
  ORGANIZATION_UPDATE: 'organization:update',
  ORGANIZATION_MANAGE_MEMBERS: 'organization:manage_members',
  ORGANIZATION_ASSIGN_ROLES: 'organization:assign_roles',
  WORKSPACE_CREATE: 'workspace:create',
  WORKSPACE_READ: 'workspace:read',
  WORKSPACE_UPDATE: 'workspace:update',
  WORKSPACE_MANAGE_MEMBERS: 'workspace:manage_members',
  WORKSPACE_ASSIGN_ROLES: 'workspace:assign_roles',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_DEFINITIONS: ReadonlyArray<{
  key: PermissionKey;
  resource: string;
  action: string;
  description: string;
}> = [
  { key: PERMISSIONS.ORGANIZATION_READ, resource: 'organization', action: 'read', description: 'Read organization details and members' },
  { key: PERMISSIONS.ORGANIZATION_UPDATE, resource: 'organization', action: 'update', description: 'Update organization settings' },
  { key: PERMISSIONS.ORGANIZATION_MANAGE_MEMBERS, resource: 'organization', action: 'manage_members', description: 'Add or remove organization members' },
  { key: PERMISSIONS.ORGANIZATION_ASSIGN_ROLES, resource: 'organization', action: 'assign_roles', description: 'Assign roles to organization members' },
  { key: PERMISSIONS.WORKSPACE_CREATE, resource: 'workspace', action: 'create', description: 'Create workspaces in an organization' },
  { key: PERMISSIONS.WORKSPACE_READ, resource: 'workspace', action: 'read', description: 'Read workspace details and members' },
  { key: PERMISSIONS.WORKSPACE_UPDATE, resource: 'workspace', action: 'update', description: 'Update workspace settings' },
  { key: PERMISSIONS.WORKSPACE_MANAGE_MEMBERS, resource: 'workspace', action: 'manage_members', description: 'Add or remove workspace members' },
  { key: PERMISSIONS.WORKSPACE_ASSIGN_ROLES, resource: 'workspace', action: 'assign_roles', description: 'Assign roles to workspace members' },
];

export const ROLE_KEYS = {
  ORG_ADMIN: 'org_admin',
  ORG_MEMBER: 'org_member',
  WS_MANAGER: 'ws_manager',
  WS_MEMBER: 'ws_member',
} as const;

export type SystemRoleKey = (typeof ROLE_KEYS)[keyof typeof ROLE_KEYS];

export const SYSTEM_ROLE_DEFINITIONS: ReadonlyArray<{
  key: SystemRoleKey;
  name: string;
  scope: RoleScope;
  description: string;
  permissions: readonly PermissionKey[];
}> = [
  {
    key: ROLE_KEYS.ORG_ADMIN,
    name: 'Organization Admin',
    scope: RoleScope.ORGANIZATION,
    description: 'Full administrative access across the organization and its workspaces',
    permissions: [
      PERMISSIONS.ORGANIZATION_READ,
      PERMISSIONS.ORGANIZATION_UPDATE,
      PERMISSIONS.ORGANIZATION_MANAGE_MEMBERS,
      PERMISSIONS.ORGANIZATION_ASSIGN_ROLES,
      PERMISSIONS.WORKSPACE_CREATE,
      PERMISSIONS.WORKSPACE_READ,
      PERMISSIONS.WORKSPACE_UPDATE,
      PERMISSIONS.WORKSPACE_MANAGE_MEMBERS,
      PERMISSIONS.WORKSPACE_ASSIGN_ROLES,
    ],
  },
  {
    key: ROLE_KEYS.ORG_MEMBER,
    name: 'Organization Member',
    scope: RoleScope.ORGANIZATION,
    description: 'Standard organization member with read access',
    permissions: [
      PERMISSIONS.ORGANIZATION_READ,
      PERMISSIONS.WORKSPACE_READ,
    ],
  },
  {
    key: ROLE_KEYS.WS_MANAGER,
    name: 'Workspace Manager',
    scope: RoleScope.WORKSPACE,
    description: 'Manage workspace settings, members, and roles',
    permissions: [
      PERMISSIONS.WORKSPACE_READ,
      PERMISSIONS.WORKSPACE_UPDATE,
      PERMISSIONS.WORKSPACE_MANAGE_MEMBERS,
      PERMISSIONS.WORKSPACE_ASSIGN_ROLES,
    ],
  },
  {
    key: ROLE_KEYS.WS_MEMBER,
    name: 'Workspace Member',
    scope: RoleScope.WORKSPACE,
    description: 'Standard workspace member with read access',
    permissions: [
      PERMISSIONS.WORKSPACE_READ,
    ],
  },
];
