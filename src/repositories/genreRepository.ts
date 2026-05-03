import type { PrismaClient } from "../generated/prisma/client.js";

export class GenreRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findAll() {
    return this.prisma.genre.findMany({ orderBy: { id: "asc" } });
  }
}
