import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { ROLE_KEYS } from '../../authz/rbac.constants.js';

export class AssignOrganizationRoleDto {
  @ApiProperty({ example: ROLE_KEYS.ORG_ADMIN, enum: [ROLE_KEYS.ORG_ADMIN, ROLE_KEYS.ORG_MEMBER] })
  @IsString()
  @IsNotEmpty()
  @IsIn([ROLE_KEYS.ORG_ADMIN, ROLE_KEYS.ORG_MEMBER])
  roleKey!: typeof ROLE_KEYS.ORG_ADMIN | typeof ROLE_KEYS.ORG_MEMBER;
}
