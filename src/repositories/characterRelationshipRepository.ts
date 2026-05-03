import type { PrismaClient } from "../generated/prisma/client.js";
import type { UpdateCharacterRelationshipInput } from "../schemas/characterRelationship.js";

export class CharacterRelationshipRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByStoryId(storyId: number) {
    return this.prisma.characterRelationship.findMany({ where: { storyId } });
  }

  update(id: number, data: UpdateCharacterRelationshipInput) {
    return this.prisma.characterRelationship.update({ where: { id }, data });
  }

  delete(id: number) {
    return this.prisma.characterRelationship.delete({ where: { id } });
  }
}
