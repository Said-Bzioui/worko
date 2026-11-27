import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ROLE_KEYS } from '../../authz/rbac.constants.js';

export class AddWorkspaceMemberDto {
  @ApiProperty({ description: 'User ID of an active organization member' })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiPropertyOptional({
    enum: [ROLE_KEYS.WS_MANAGER, ROLE_KEYS.WS_MEMBER],
    default: ROLE_KEYS.WS_MEMBER,
  })
  @IsOptional()
  @IsString()
  @IsIn([ROLE_KEYS.WS_MANAGER, ROLE_KEYS.WS_MEMBER])
  roleKey?: typeof ROLE_KEYS.WS_MANAGER | typeof ROLE_KEYS.WS_MEMBER;
}
