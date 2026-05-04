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

  async findAll(uid: string) {
    const stories = await this.prisma.story.findMany({
      where: { user: { uid } },
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

  async isOwnedBy(storyId: number, userId: number): Promise<boolean> {
    const count = await this.prisma.story.count({ where: { id: storyId, userId } });
    return count > 0;
  }

  async isOwnedByUid(storyId: number, uid: string): Promise<boolean> {
    const count = await this.prisma.story.count({ where: { id: storyId, user: { uid } } });
    return count > 0;
  }

  async findById(id: number) {
    const story = await this.prisma.story.findUnique({
      where: { id },
      include: {
        ...includeGenres,
        characters: true,
        publishSettings: { select: { coverImageUrl: true } },
      },
    });
    if (!story) return null;
    const { publishSettings, ...rest } = story;
    return { ...formatStory(rest), coverImageUrl: publishSettings?.coverImageUrl ?? null };
  }

  async create(input: CreateStoryInput, uid: string) {
    const { genreIds, ...rest } = input;
    const story = await this.prisma.story.create({
      data: {
        ...rest,
        user: { connect: { uid } },
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

  async findPublicById(id: number) {
    const story = await this.prisma.story.findUnique({
      where: { id },
      include: {
        storyGenres: { include: { genre: true } },
        user: { select: { name: true } },
        publishSettings: {
          select: {
            coverImageUrl: true,
            description: true,
            tags: true,
            publishedAt: true,
          },
        },
        episodes: {
          where: { status: 'PUBLISHED' },
          orderBy: { number: 'asc' },
          include: {
            pages: {
              take: 1,
              orderBy: { pageNumber: 'asc' },
              where: { imageUrl: { not: null } },
              select: { imageUrl: true },
            },
          },
        },
      },
    });
    if (!story) return null;
    const { storyGenres, user, publishSettings, episodes, ...rest } = story;
    const published = episodes.filter((e) => e.status === 'PUBLISHED');
    return {
      ...rest,
      genres: storyGenres.map((sg) => sg.genre),
      authorName: user?.name ?? null,
      description: publishSettings?.description ?? null,
      tags: publishSettings?.tags ?? [],
      coverImageUrl: publishSettings?.coverImageUrl ?? null,
      publishedAt: publishSettings?.publishedAt ?? null,
      firstEpisodeCreatedAt: published[0]?.createdAt ?? null,
      latestEpisodeCreatedAt: published[published.length - 1]?.createdAt ?? null,
      episodes: published.map((ep) => ({
        id: ep.id,
        number: ep.number,
        title: ep.title,
        thumbnailUrl: ep.pages[0]?.imageUrl ?? null,
        createdAt: ep.createdAt,
      })),
    };
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
