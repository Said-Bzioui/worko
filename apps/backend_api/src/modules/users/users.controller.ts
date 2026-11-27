import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, Version } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@said-bzioui/database';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UsersService } from './users.service.js';
import { RoleGuard } from '../../guards/role.guard.js';
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @Version('1')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiCreatedResponse({ description: 'User created successfully' })
  createUser(@Body() dto: CreateUserDto): Promise<User> {
    return this.usersService.createUser(dto);
  }

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'List all users' })
  @ApiOkResponse({ description: 'Users retrieved successfully' })
  findAll() {
    return this.usersService.findAllUsers();
    // return [
    //   { id: '1', name: 'Said', email: 'said@example.test' },
    //   { id: '2', name: 'Ahmed', email: 'ahmed@example.test' },
    // ];
  }

  @Get(':id')
  @Version('1')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiOkResponse({ description: 'User retrieved successfully' })
  getUserById(@Param('id') id: string): Promise<User> {
    return this.usersService.getUserById(id);
  }

  @Patch(':id')
  @Version('1')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiOkResponse({ description: 'User updated successfully' })
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto): Promise<User> {
    return this.usersService.updateUser(id, dto);
  }

  @Delete(':id')
  @Version('1')
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiOkResponse({ description: 'User deleted successfully' })
  @UseGuards(RoleGuard)
  deleteUser(@Param('id') id: string): Promise<User> {
    return this.usersService.deleteUser(id);
  }
} 
