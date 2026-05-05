import type { UserRepository } from "../repositories/userRepository.js";
import type { SyncUserInput } from "../schemas/user.js";

export class UserUsecase {
  constructor(private readonly userRepo: UserRepository) {}

  syncUser(input: SyncUserInput) {
    return this.userRepo.upsertByUid(input);
  }

  findByUid(uid: string) {
    return this.userRepo.findByUid(uid);
  }
}
