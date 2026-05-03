import type { PrismaClient } from "../generated/prisma/client.js";
import type { PublishSettingsInput } from "../schemas/publishSettings.js";

export class PublishSettingsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByStoryId(storyId: number) {
    return this.prisma.publishSettings.findUnique({ where: { storyId } });
  }

  upsert(storyId: number, input: PublishSettingsInput) {
    const data = input;
    return this.prisma.publishSettings.upsert({
      where: { storyId },
      create: { ...data, story: { connect: { id: storyId } } },
      update: data,
    });
  }

  publish(storyId: number) {
    return this.prisma.publishSettings.upsert({
      where: { storyId },
      create: { publishedAt: new Date(), characterIds: [], tags: [], story: { connect: { id: storyId } } },
      update: { publishedAt: new Date() },
    });
  }

  unpublish(storyId: number) {
    return this.prisma.publishSettings.upsert({
      where: { storyId },
      create: { publishedAt: null, characterIds: [], tags: [], story: { connect: { id: storyId } } },
      update: { publishedAt: null },
    });
  }
}
