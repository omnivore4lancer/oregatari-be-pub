import type { PrismaClient } from "../generated/prisma/client.js";
import { JobStatus, JobType } from "../generated/prisma/client.js";

export class JobRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(data: { mastraRunId: string; episodeId?: number; storyId?: number; pageNumber?: number; jobType?: JobType }) {
    return this.prisma.job.create({ data });
  }

  findById(id: string) {
    return this.prisma.job.findUnique({ where: { id } });
  }

  findRunningByEpisodeId(episodeId: number) {
    return this.prisma.job.findMany({
      where: { episodeId, status: JobStatus.RUNNING },
      select: { id: true, pageNumber: true, mastraRunId: true, jobType: true, usedModel: true, imageModel: true },
    });
  }

  findRecentlyFailedByEpisodeId(episodeId: number, withinSeconds = 60) {
    const since = new Date(Date.now() - withinSeconds * 1000);
    return this.prisma.job.findMany({
      where: { episodeId, status: JobStatus.FAILED, updatedAt: { gte: since } },
      select: { id: true, pageNumber: true, errorMessage: true, jobType: true, usedModel: true, imageModel: true },
    });
  }

  findRecentlyDoneByEpisodeId(episodeId: number, withinSeconds = 30) {
    const since = new Date(Date.now() - withinSeconds * 1000);
    return this.prisma.job.findMany({
      where: { episodeId, status: JobStatus.DONE, updatedAt: { gte: since } },
      select: { id: true, pageNumber: true, jobType: true, usedModel: true, imageModel: true },
    });
  }

  findRunning() {
    return this.prisma.job.findMany({
      where: { status: JobStatus.RUNNING },
      select: { id: true, mastraRunId: true, jobType: true },
    });
  }

  findAll({ page, limit, status, jobType }: { page: number; limit: number; status?: JobStatus; jobType?: JobType }) {
    const where = {
      ...(status ? { status } : {}),
      ...(jobType ? { jobType } : {}),
    };
    return this.prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        storyId: true,
        pageNumber: true,
        jobType: true,
        status: true,
        errorMessage: true,
        usedModel: true,
        imageModel: true,
        createdAt: true,
        updatedAt: true,
        episode: {
          select: {
            id: true,
            number: true,
            title: true,
            story: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  countAll({ status, jobType }: { status?: JobStatus; jobType?: JobType }) {
    const where = {
      ...(status ? { status } : {}),
      ...(jobType ? { jobType } : {}),
    };
    return this.prisma.job.count({ where });
  }

  updateStatus(id: string, status: JobStatus, errorMessage?: string, usedModel?: string, imageModel?: string | null) {
    return this.prisma.job.update({
      where: { id },
      data: {
        status,
        ...(errorMessage !== undefined ? { errorMessage } : {}),
        ...(usedModel !== undefined ? { usedModel } : {}),
        ...(imageModel !== undefined ? { imageModel } : {}),
      },
    });
  }
}

export { JobStatus, JobType };
