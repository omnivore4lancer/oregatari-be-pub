import type { PrismaClient } from "../generated/prisma/client.js";
import type { SyncUserInput } from "../schemas/user.js";

export class UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByUid(uid: string) {
    return this.prisma.user.findUnique({ where: { uid } });
  }

  upsertByUid(input: SyncUserInput) {
    return this.prisma.user.upsert({
      where: { uid: input.uid },
      create: { uid: input.uid, email: input.email },
      update: { email: input.email },
    });
  }
}
