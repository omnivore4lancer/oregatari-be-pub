import type { EpisodePageRepository } from "../repositories/episodePageRepository.js";
import type { SaveEpisodePageInput } from "../schemas/episodePage.js";

export class EpisodePageUsecase {
  constructor(private readonly repo: EpisodePageRepository) {}

  getPages(episodeId: number) {
    return this.repo.findByEpisodeId(episodeId);
  }

  savePage(episodeId: number, input: SaveEpisodePageInput) {
    return this.repo.upsert(episodeId, input);
  }

  deletePages(episodeId: number) {
    return this.repo.deleteByEpisodeId(episodeId);
  }
}
