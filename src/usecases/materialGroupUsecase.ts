import type { MaterialGroupRepository } from "../repositories/materialGroupRepository.js";
import type { CreateMaterialGroupInput } from "../schemas/materialGroup.js";

export class MaterialGroupUsecase {
  constructor(private readonly repo: MaterialGroupRepository) {}

  getGroups(storyId: number) {
    return this.repo.findByStoryId(storyId);
  }

  createGroup(storyId: number, input: CreateMaterialGroupInput) {
    return this.repo.create(storyId, input);
  }

  async deleteGroup(storyId: number, groupId: number) {
    const group = await this.repo.findById(groupId);
    if (!group) throw new MaterialGroupNotFoundError(groupId);
    if (group.storyId !== storyId) throw new MaterialGroupNotFoundError(groupId);
    return this.repo.delete(groupId);
  }
}

export class MaterialGroupNotFoundError extends Error {
  constructor(id: number) {
    super(`MaterialGroup ${id} not found`);
    this.name = "MaterialGroupNotFoundError";
  }
}
