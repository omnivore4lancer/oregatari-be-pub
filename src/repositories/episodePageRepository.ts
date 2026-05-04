import type { PrismaClient } from "../generated/prisma/client.js";
import type { SaveEpisodePageInput } from "../schemas/episodePage.js";

export class EpisodePageRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByEpisodeId(episodeId: number) {
    return this.prisma.episodePage.findMany({
      where: { episodeId },
      orderBy: { pageNumber: "asc" },
      include: {
        rows: {
          orderBy: { rowNumber: "asc" },
          include: {
            panels: { orderBy: { panelOrder: "asc" } },
          },
        },
      },
    });
  }

  findByEpisodeIdAndPageNumber(episodeId: number, pageNumber: number) {
    return this.prisma.episodePage.findUnique({
      where: { episodeId_pageNumber: { episodeId, pageNumber } },
      include: {
        rows: {
          orderBy: { rowNumber: "asc" },
          include: {
            panels: { orderBy: { panelOrder: "asc" } },
          },
        },
      },
    });
  }

  async upsert(episodeId: number, input: SaveEpisodePageInput) {
    const page = await this.prisma.episodePage.upsert({
      where: { episodeId_pageNumber: { episodeId, pageNumber: input.pageNumber } },
      update: { instructions: input.instructions ?? null },
      create: { episodeId, pageNumber: input.pageNumber, instructions: input.instructions ?? null },
    });

    await this.prisma.episodePageRow.deleteMany({ where: { pageId: page.id } });

    for (const row of input.rows) {
      const pageRow = await this.prisma.episodePageRow.create({
        data: {
          pageId: page.id,
          rowNumber: row.rowNumber,
          heightRatio: row.heightRatio,
          layoutType: row.layoutType,
        },
      });

      for (const panel of row.panels) {
        await this.prisma.episodePanel.create({
          data: {
            rowId: pageRow.id,
            panelOrder: panel.panelOrder,
            pagePosition: panel.pagePosition ?? null,
            description: panel.description ?? null,
            cameraAngle: panel.cameraAngle ?? null,
            perspectiveIntensity: panel.perspectiveIntensity ?? null,
            depthLayers: panel.depthLayers ?? {},
            background: panel.background ?? null,
            characters: panel.characters ?? [],
            effects: panel.effects ?? [],
            lensAndLighting: panel.lensAndLighting ?? null,
            frame: panel.frame ?? "normal",
            scale: panel.scale ?? 1.0,
            imagePrompt: panel.imagePrompt ?? null,
            imageUrl: panel.imageUrl ?? null,
          },
        });
      }
    }

    return this.findByEpisodeIdAndPageNumber(episodeId, input.pageNumber);
  }

  async findPublicByEpisodeId(episodeId: number) {
    const episode = await this.prisma.episode.findFirst({
      where: { id: episodeId, status: "PUBLISHED" },
      select: { id: true },
    });
    if (!episode) return null;
    return this.findByEpisodeId(episodeId);
  }

  async deleteByEpisodeId(episodeId: number) {
    return this.prisma.episodePage.deleteMany({ where: { episodeId } });
  }
}
