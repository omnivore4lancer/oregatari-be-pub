import type { StoryRepository } from "../repositories/storyRepository.js";
import type { CreateStoryInput, UpdateStoryInput } from "../schemas/story.js";

export class StoryUsecase {
  constructor(private readonly storyRepo: StoryRepository) {}

  getStories(uid: string) {
    return this.storyRepo.findAll(uid);
  }

  async getStory(id: number) {
    const story = await this.storyRepo.findById(id);
    if (!story) throw new StoryNotFoundError(id);
    return story;
  }

  createStory(input: CreateStoryInput, uid: string) {
    return this.storyRepo.create(input, uid);
  }

  updateStory(id: number, input: UpdateStoryInput) {
    return this.storyRepo.update(id, input);
  }

  deleteStory(id: number) {
    return this.storyRepo.delete(id);
  }

  getPublicStory(id: number) {
    return this.storyRepo.findPublicById(id);
  }

  isOwnedBy(storyId: number, userId: number) {
    return this.storyRepo.isOwnedBy(storyId, userId);
  }

  isOwnedByUid(storyId: number, uid: string) {
    return this.storyRepo.isOwnedByUid(storyId, uid);
  }
}

export class StoryNotFoundError extends Error {
  constructor(id: number) {
    super(`Story ${id} not found`);
    this.name = "StoryNotFoundError";
  }
}
