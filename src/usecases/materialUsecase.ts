import type { MaterialRepository } from "../repositories/materialRepository.js";
import type { CreateMaterialInput, UpdateMaterialInput } from "../schemas/material.js";

export class MaterialUsecase {
  constructor(private readonly repo: MaterialRepository) {}

  getMaterials(storyId: number, groupId?: number, search?: string, sort: "asc" | "desc" = "desc") {
    return this.repo.findByStoryId(storyId, groupId, search, sort);
  }

  async getMaterial(storyId: number, materialId: number) {
    const material = await this.repo.findById(materialId);
    if (!material) throw new MaterialNotFoundError(materialId);
    if (material.storyId !== storyId) throw new MaterialNotFoundError(materialId);
    return material;
  }

  createMaterial(storyId: number, input: CreateMaterialInput) {
    return this.repo.create(storyId, input);
  }

  async updateMaterial(storyId: number, materialId: number, input: UpdateMaterialInput) {
    await this.getMaterial(storyId, materialId);
    return this.repo.update(materialId, input);
  }

  async deleteMaterial(storyId: number, materialId: number) {
    await this.getMaterial(storyId, materialId);
    return this.repo.delete(materialId);
  }
}

export class MaterialNotFoundError extends Error {
  constructor(id: number) {
    super(`Material ${id} not found`);
    this.name = "MaterialNotFoundError";
  }
}
