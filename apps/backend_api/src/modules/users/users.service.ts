import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes, randomUUID, scryptSync } from 'node:crypto';
import type { User } from '@said-bzioui/database';
import { PrismaService } from '../../lib/prisma/prisma.service.js';
import type { CreateUserDto } from './dto/create-user.dto.js';
import type { UpdateUserDto } from './dto/update-user.dto.js';
import { UserLogger } from './user.logger.js';

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService, private readonly logger: UserLogger) { }

  async createUser(dto: CreateUserDto): Promise<User> {
    this.logger.log(`Creating user with email "${dto.email}"`);
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException(`User with email "${dto.email}" already exists`);
    }

    return this.prisma.user.create({
      data: {
        id: randomUUID(),
        email: dto.email,
        name: dto.name,
        password: hashPassword(dto.password),
      },
    });
  }



  async findAllUsers(): Promise<User[]> {
    this.logger.log('Finding all users');
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    this.logger.log(`Found [${users.length}] users`);
    return users;
  }

  async getUserById(id: string): Promise<User> {
    this.logger.log(`Finding user with id "${id}"`);
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      this.logger.log(`User with id "${id}" not found`);
      throw new NotFoundException(`User with id "${id}" not found`);
    }
    return user;
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<User> {
    this.logger.log(`Updating user with id "${id}"`);
    await this.getUserById(id);
    this.logger.log(`User with id "${id}" found`);

    this.logger.log(`Updating user with id "${id}"`);
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.image !== undefined ? { image: dto.image } : {}),
      },
    });
  }

  async deleteUser(id: string): Promise<User> {
    this.logger.log(`Deleting user with id "${id}"`);
    await this.getUserById(id);
    this.logger.log(`User with id "${id}" found`);

    this.logger.log(`Deleting user with id "${id}"`);
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
