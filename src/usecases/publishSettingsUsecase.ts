import type { PublishSettingsRepository } from "../repositories/publishSettingsRepository.js";
import type { PublishSettingsInput } from "../schemas/publishSettings.js";

export class PublishSettingsUsecase {
  constructor(private readonly repo: PublishSettingsRepository) {}

  getPublishSettings(storyId: number) {
    return this.repo.findByStoryId(storyId);
  }

  upsertPublishSettings(storyId: number, input: PublishSettingsInput) {
    return this.repo.upsert(storyId, input);
  }
}
