import type { PrismaClient } from "../generated/prisma/client.js";
import type { CreateStoryInput, UpdateStoryInput } from "../schemas/story.js";

const includeGenres = {
  storyGenres: { include: { genre: true } },
} as const;

function formatStory<T extends { storyGenres: { genre: { id: number; name: string } }[] }>(
  story: T
) {
  const { storyGenres, ...rest } = story;
  return { ...rest, genres: storyGenres.map((sg) => sg.genre) };
}

export class StoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll() {
    const stories = await this.prisma.story.findMany({
      include: {
        ...includeGenres,
        publishSettings: { select: { coverImageUrl: true } },
        episodes: {
          take: 1,
          orderBy: { number: 'asc' as const },
          include: {
            pages: {
              where: { imageUrl: { not: null } },
              take: 4,
              orderBy: { pageNumber: 'asc' as const },
              select: { imageUrl: true },
            },
          },
        },
      },
    });
    return stories.map((story) => {
      const { storyGenres, publishSettings, episodes, ...rest } = story;
      const previewImages = episodes.flatMap((e) => e.pages.map((p) => p.imageUrl as string));
      return {
        ...rest,
        genres: storyGenres.map((sg) => sg.genre),
        coverImageUrl: publishSettings?.coverImageUrl ?? null,
        previewImages,
      };
    });
  }

  async findById(id: number) {
    const story = await this.prisma.story.findUnique({
      where: { id },
      include: { ...includeGenres, characters: true },
    });
    if (!story) return null;
    return formatStory(story);
  }

  async create(input: CreateStoryInput) {
    const { genreIds, ...rest } = input;
    const story = await this.prisma.story.create({
      data: {
        ...rest,
        storyGenres: { create: genreIds.map((genreId) => ({ genreId })) },
      },
      include: includeGenres,
    });
    return formatStory(story);
  }

  async update(id: number, input: UpdateStoryInput) {
    const { genreIds, ...rest } = input;
    const genreUpdate =
      genreIds !== undefined
        ? {
            storyGenres: {
              deleteMany: {},
              create: genreIds.map((genreId) => ({ genreId })),
            },
          }
        : {};
    const story = await this.prisma.story.update({
      where: { id },
      data: { ...rest, ...genreUpdate },
      include: includeGenres,
    });
    return formatStory(story);
  }

  async delete(id: number) {
    await this.prisma.$transaction([
      // Episode は自己参照(parent/sequels)があるため先に parentId をクリア
      this.prisma.episode.updateMany({ where: { storyId: id }, data: { parentId: null } }),
      this.prisma.publishSettings.deleteMany({ where: { storyId: id } }),
      this.prisma.panel.deleteMany({ where: { storyId: id } }),
      this.prisma.material.deleteMany({ where: { storyId: id } }),
      this.prisma.materialGroup.deleteMany({ where: { storyId: id } }),
      this.prisma.job.deleteMany({ where: { episode: { storyId: id } } }),
      this.prisma.episodeCharacter.deleteMany({ where: { episode: { storyId: id } } }),
      this.prisma.episodePage.deleteMany({ where: { episode: { storyId: id } } }),
      this.prisma.episode.deleteMany({ where: { storyId: id } }),
      this.prisma.characterRelationship.deleteMany({ where: { fromCharacter: { storyId: id } } }),
      this.prisma.character.deleteMany({ where: { storyId: id } }),
      this.prisma.storyGenre.deleteMany({ where: { storyId: id } }),
      this.prisma.story.delete({ where: { id } }),
    ]);
  }
}
