import type { CharacterRepository } from "../repositories/characterRepository.js";
import type { CreateCharacterInput, UpdateCharacterInput } from "../schemas/character.js";

export class CharacterUsecase {
  constructor(private readonly repo: CharacterRepository) {}

  getCharacters(storyId: number) {
    return this.repo.findByStoryId(storyId);
  }

  async getCharacter(storyId: number, charId: number) {
    const character = await this.repo.findById(charId);
    if (!character) throw new CharacterNotFoundError(charId);
    if (character.storyId !== storyId) throw new CharacterNotFoundError(charId);
    return character;
  }

  createCharacter(storyId: number, input: CreateCharacterInput) {
    return this.repo.create(storyId, input);
  }

  async updateCharacter(storyId: number, charId: number, input: UpdateCharacterInput) {
    await this.getCharacter(storyId, charId);
    return this.repo.update(charId, input);
  }

  async deleteCharacter(storyId: number, charId: number) {
    await this.getCharacter(storyId, charId);
    return this.repo.delete(charId);
  }
}

export class CharacterNotFoundError extends Error {
  constructor(id: number) {
    super(`Character ${id} not found`);
    this.name = "CharacterNotFoundError";
  }
}
