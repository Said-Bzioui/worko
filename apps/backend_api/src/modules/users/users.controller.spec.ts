import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Said',
    email: 'said@example.test',
  };

  const mockUsersService = {
    createUser: vi.fn().mockResolvedValue(mockUser),
    findAllUsers: vi.fn().mockResolvedValue([mockUser]),
    getUserById: vi.fn().mockResolvedValue(mockUser),
    updateUser: vi.fn().mockResolvedValue({ ...mockUser, name: 'Said Updated' }),
    deleteUser: vi.fn().mockResolvedValue(mockUser),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should create a user', async () => {
    await expect(
      controller.createUser({
        email: 'said@example.test',
        password: 'Password123!',
        name: 'Said',
      }),
    ).resolves.toMatchObject({ id: mockUser.id, email: 'said@example.test' });
  });

  it('should return all users', async () => {
    await expect(controller.findAll()).resolves.toEqual([mockUser]);
  });

  it('should return a user by id', async () => {
    await expect(controller.getUserById(mockUser.id)).resolves.toMatchObject({ id: mockUser.id });
  });

  it('should update a user', async () => {
    await expect(controller.updateUser(mockUser.id, { name: 'Said Updated' })).resolves.toMatchObject({
      name: 'Said Updated',
    });
  });

  it('should delete a user', async () => {
    await expect(controller.deleteUser(mockUser.id)).resolves.toMatchObject({ id: mockUser.id });
  });
});
