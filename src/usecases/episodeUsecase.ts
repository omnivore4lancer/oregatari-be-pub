import type { EpisodeRepository } from "../repositories/episodeRepository.js";
import type { CreateEpisodeInput, UpdateEpisodeInput } from "../schemas/episode.js";

export class EpisodeUsecase {
  constructor(private readonly repo: EpisodeRepository) {}

  getEpisodes(storyId: number, status?: string, relation?: string) {
    return this.repo.findByStoryId(storyId, status, relation);
  }

  async getEpisode(storyId: number, episodeId: number) {
    const episode = await this.repo.findById(episodeId);
    if (!episode) throw new EpisodeNotFoundError(episodeId);
    if (episode.storyId !== storyId) throw new EpisodeNotFoundError(episodeId);
    return episode;
  }

  createEpisode(storyId: number, input: CreateEpisodeInput) {
    return this.repo.create(storyId, input);
  }

  async updateEpisode(storyId: number, episodeId: number, input: UpdateEpisodeInput) {
    await this.getEpisode(storyId, episodeId);
    return this.repo.update(episodeId, input);
  }

  async deleteEpisode(storyId: number, episodeId: number) {
    await this.getEpisode(storyId, episodeId);
    return this.repo.delete(episodeId);
  }
}

export class EpisodeNotFoundError extends Error {
  constructor(id: number) {
    super(`Episode ${id} not found`);
    this.name = "EpisodeNotFoundError";
  }
}
