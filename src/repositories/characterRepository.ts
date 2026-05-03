import type { PrismaClient } from "../generated/prisma/client.js";
import type { CreateCharacterInput, UpdateCharacterInput } from "../schemas/character.js";

export class CharacterRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByStoryId(storyId: number) {
    return this.prisma.character.findMany({ where: { storyId } });
  }

  findById(id: number) {
    return this.prisma.character.findUnique({ where: { id } });
  }

  create(storyId: number, input: CreateCharacterInput) {
    const data = input;
    return this.prisma.character.create({
      data: { ...data, story: { connect: { id: storyId } } },
    });
  }

  update(id: number, input: UpdateCharacterInput) {
    const data = input;
    return this.prisma.character.update({ where: { id }, data });
  }

  delete(id: number) {
    return this.prisma.character.delete({ where: { id } });
  }
}
