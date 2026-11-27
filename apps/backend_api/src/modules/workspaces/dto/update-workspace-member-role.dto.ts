import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { ROLE_KEYS } from '../../authz/rbac.constants.js';

export class UpdateWorkspaceMemberRoleDto {
  @ApiProperty({ enum: [ROLE_KEYS.WS_MANAGER, ROLE_KEYS.WS_MEMBER] })
  @IsString()
  @IsNotEmpty()
  @IsIn([ROLE_KEYS.WS_MANAGER, ROLE_KEYS.WS_MEMBER])
  roleKey!: typeof ROLE_KEYS.WS_MANAGER | typeof ROLE_KEYS.WS_MEMBER;
}
