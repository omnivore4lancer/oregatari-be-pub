import type { PrismaClient } from "../generated/prisma/client.js";
import type { SavePanelsInput } from "../schemas/panel.js";

export class PanelRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByStoryId(storyId: number) {
    return this.prisma.panel.findMany({
      where: { storyId },
      orderBy: { createdAt: "asc" },
    });
  }

  async save(storyId: number, input: SavePanelsInput) {
    const panels = input;
    await this.prisma.panel.deleteMany({ where: { storyId } });
    if (panels.length === 0) return [];
    return this.prisma.panel.createManyAndReturn({
      data: panels.map(({ id, vertices, prompt, imageUrl }) => ({
        id,
        storyId,
        vertices,
        prompt,
        imageUrl: imageUrl ?? null,
      })),
    });
  }
}
