import type { StoryRepository } from "../repositories/storyRepository.js";
import type { CreateStoryInput, UpdateStoryInput } from "../schemas/story.js";

export class StoryUsecase {
  constructor(private readonly storyRepo: StoryRepository) {}

  getStories(userId: number) {
    return this.storyRepo.findAll(userId);
  }

  async getStory(id: number) {
    const story = await this.storyRepo.findById(id);
    if (!story) throw new StoryNotFoundError(id);
    return story;
  }

  createStory(input: CreateStoryInput, userId: number) {
    return this.storyRepo.create(input, userId);
  }

  updateStory(id: number, input: UpdateStoryInput) {
    return this.storyRepo.update(id, input);
  }

  deleteStory(id: number) {
    return this.storyRepo.delete(id);
  }

  isOwnedBy(storyId: number, userId: number) {
    return this.storyRepo.isOwnedBy(storyId, userId);
  }
}

export class StoryNotFoundError extends Error {
  constructor(id: number) {
    super(`Story ${id} not found`);
    this.name = "StoryNotFoundError";
  }
}
