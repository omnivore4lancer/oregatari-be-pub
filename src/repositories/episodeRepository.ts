import type { PrismaClient } from "../generated/prisma/client.js";
import type { CreateEpisodeInput, UpdateEpisodeInput } from "../schemas/episode.js";

const includeCharacters = { characters: true, _count: { select: { pages: true } } } as const;

export class EpisodeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByStoryId(storyId: number, status?: string, relation?: string) {
    return this.prisma.episode.findMany({
      where: {
        storyId,
        ...(status && { status: status as "UNPUBLISHED" | "PUBLISHED" }),
        ...(relation && { relation: relation as "SEQUEL" | "PARALLEL" | "STANDALONE" }),
      },
      include: includeCharacters,
      orderBy: { number: "asc" },
    });
  }

  findById(id: number) {
    return this.prisma.episode.findUnique({ where: { id }, include: includeCharacters });
  }

  create(storyId: number, input: CreateEpisodeInput) {
    const { parentId, characters, ...rest } = input;
    return this.prisma.episode.create({
      data: {
        ...rest,
        story: { connect: { id: storyId } },
        ...(parentId && { parent: { connect: { id: parentId } } }),
        characters: { create: characters },
      },
      include: includeCharacters,
    });
  }

  update(id: number, input: UpdateEpisodeInput) {
    const { parentId, characters, ...rest } = input;
    return this.prisma.episode.update({
      where: { id },
      data: {
        ...rest,
        ...(parentId !== undefined && {
          parent: parentId ? { connect: { id: parentId } } : { disconnect: true },
        }),
        ...(characters !== undefined && {
          characters: { deleteMany: {}, create: characters },
        }),
      },
      include: includeCharacters,
    });
  }

  delete(id: number) {
    return this.prisma.$transaction([
      this.prisma.episodeCharacter.deleteMany({ where: { episodeId: id } }),
      this.prisma.episode.delete({ where: { id } }),
    ]);
  }
}
