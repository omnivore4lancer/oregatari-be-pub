import type { JobRepository } from "../repositories/jobRepository.js";
import { JobStatus, JobType } from "../repositories/jobRepository.js";

export class JobUsecase {
  constructor(private readonly repo: JobRepository) {}

  create(episodeId: number, mastraRunId: string, pageNumber?: number, jobType?: JobType) {
    return this.repo.create({ episodeId, mastraRunId, pageNumber, jobType });
  }

  createCoverImageJob(storyId: number, mastraRunId: string) {
    return this.repo.create({ storyId, mastraRunId, jobType: JobType.COVER_IMAGE });
  }

  findById(id: string) {
    return this.repo.findById(id);
  }

  findByIdForUser(id: string, uid: string) {
    return this.repo.findByIdForUser(id, uid);
  }

  findRunningByEpisodeId(episodeId: number) {
    return this.repo.findRunningByEpisodeId(episodeId);
  }

  findRecentlyFailedByEpisodeId(episodeId: number) {
    return this.repo.findRecentlyFailedByEpisodeId(episodeId);
  }

  findRecentlyDoneByEpisodeId(episodeId: number) {
    return this.repo.findRecentlyDoneByEpisodeId(episodeId);
  }

  findRunning() {
    return this.repo.findRunning();
  }

  findAll(params: { page: number; limit: number; status?: JobStatus; jobType?: JobType; uid: string }) {
    return this.repo.findAll(params);
  }

  countAll(params: { status?: JobStatus; jobType?: JobType; uid: string }) {
    return this.repo.countAll(params);
  }

  markDone(id: string, usedModel?: string, imageModel?: string | null) {
    return this.repo.updateStatus(id, JobStatus.DONE, undefined, usedModel, imageModel);
  }

  markFailed(id: string, errorMessage?: string) {
    return this.repo.updateStatus(id, JobStatus.FAILED, errorMessage);
  }
}
