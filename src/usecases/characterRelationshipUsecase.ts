import type { CharacterRelationshipRepository } from "../repositories/characterRelationshipRepository.js";
import type { UpdateCharacterRelationshipInput } from "../schemas/characterRelationship.js";

export class CharacterRelationshipUsecase {
  constructor(private readonly repo: CharacterRelationshipRepository) {}

  getRelationships(storyId: number) {
    return this.repo.findByStoryId(storyId);
  }

  updateRelationship(id: number, input: UpdateCharacterRelationshipInput) {
    return this.repo.update(id, input);
  }

  deleteRelationship(id: number) {
    return this.repo.delete(id);
  }
}
