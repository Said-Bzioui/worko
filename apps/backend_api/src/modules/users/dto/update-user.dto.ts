import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString } from 'class-validator';



export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Said Bzioui' })
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png', nullable: true })
  @IsString()
  image?: string | null;
}
