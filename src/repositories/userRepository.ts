import type { PrismaClient } from "../generated/prisma/client.js";
import type { CreateUserInput, UpdateUserInput } from "../schemas/user.js";

export class UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findAll() {
    return this.prisma.user.findMany();
  }

  findById(id: number) {
    return this.prisma.user.findUnique({ where: { user_id: id } });
  }

  create(input: CreateUserInput) {
    const data = input;
    return this.prisma.user.create({ data });
  }

  update(id: number, input: UpdateUserInput) {
    const data = input;
    return this.prisma.user.update({ where: { user_id: id }, data });
  }

  delete(id: number) {
    return this.prisma.user.delete({ where: { user_id: id } });
  }
}
