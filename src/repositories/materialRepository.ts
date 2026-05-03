import type { PrismaClient } from "../generated/prisma/client.js";
import type { CreateMaterialInput, UpdateMaterialInput } from "../schemas/material.js";

export class MaterialRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByStoryId(storyId: number, groupId?: number, search?: string, sort: "asc" | "desc" = "desc") {
    return this.prisma.material.findMany({
      where: {
        storyId,
        ...(groupId !== undefined && { groupId }),
        ...(search && { name: { contains: search } }),
      },
      include: { group: true },
      orderBy: { createdAt: sort },
    });
  }

  findById(id: number) {
    return this.prisma.material.findUnique({ where: { id }, include: { group: true } });
  }

  create(storyId: number, input: CreateMaterialInput) {
    const { groupId, ...rest } = input;
    return this.prisma.material.create({
      data: {
        ...rest,
        story: { connect: { id: storyId } },
        group: { connect: { id: groupId } },
      },
      include: { group: true },
    });
  }

  update(id: number, input: UpdateMaterialInput) {
    const { groupId, ...rest } = input;
    return this.prisma.material.update({
      where: { id },
      data: {
        ...rest,
        ...(groupId !== undefined && { group: { connect: { id: groupId } } }),
      },
      include: { group: true },
    });
  }

  delete(id: number) {
    return this.prisma.material.delete({ where: { id } });
  }
}
