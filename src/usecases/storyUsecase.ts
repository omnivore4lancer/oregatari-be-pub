import type { StoryRepository } from "../repositories/storyRepository.js";
import type { CreateStoryInput, UpdateStoryInput } from "../schemas/story.js";

export class StoryUsecase {
  constructor(private readonly storyRepo: StoryRepository) {}

  getStories() {
    return this.storyRepo.findAll();
  }

  async getStory(id: number) {
    const story = await this.storyRepo.findById(id);
    if (!story) throw new StoryNotFoundError(id);
    return story;
  }

  createStory(input: CreateStoryInput) {
    return this.storyRepo.create(input);
  }

  updateStory(id: number, input: UpdateStoryInput) {
    return this.storyRepo.update(id, input);
  }

  deleteStory(id: number) {
    return this.storyRepo.delete(id);
  }
}

export class StoryNotFoundError extends Error {
  constructor(id: number) {
    super(`Story ${id} not found`);
    this.name = "StoryNotFoundError";
  }
}
