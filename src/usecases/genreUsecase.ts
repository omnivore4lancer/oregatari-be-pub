import type { GenreRepository } from "../repositories/genreRepository.js";

export class GenreUsecase {
  constructor(private readonly repo: GenreRepository) {}

  getGenres() {
    return this.repo.findAll();
  }
}
