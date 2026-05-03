import type { PrismaClient } from "../generated/prisma/client.js";
import type { CreateMaterialGroupInput } from "../schemas/materialGroup.js";

export class MaterialGroupRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByStoryId(storyId: number) {
    return this.prisma.materialGroup.findMany({
      where: { storyId },
      orderBy: { createdAt: "asc" },
    });
  }

  findById(id: number) {
    return this.prisma.materialGroup.findUnique({ where: { id } });
  }

  create(storyId: number, input: CreateMaterialGroupInput) {
    const data = input;
    return this.prisma.materialGroup.create({
      data: { ...data, story: { connect: { id: storyId } } },
    });
  }

  delete(id: number) {
    return this.prisma.materialGroup.delete({ where: { id } });
  }
}