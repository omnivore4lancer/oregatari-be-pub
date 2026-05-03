import type { UserRepository } from "../repositories/userRepository.js";
import type { CreateUserInput, UpdateUserInput } from "../schemas/user.js";

export class UserUsecase {
  constructor(private readonly userRepo: UserRepository) {}

  getUsers() {
    return this.userRepo.findAll();
  }

  async getUser(id: number) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new UserNotFoundError(id);
    return user;
  }

  registerUser(input: CreateUserInput) {
    return this.userRepo.create(input);
  }

  updateUser(id: number, input: UpdateUserInput) {
    return this.userRepo.update(id, input);
  }

  deleteUser(id: number) {
    return this.userRepo.delete(id);
  }
}

export class UserNotFoundError extends Error {
  constructor(id: number) {
    super(`User ${id} not found`);
    this.name = "UserNotFoundError";
  }
}
