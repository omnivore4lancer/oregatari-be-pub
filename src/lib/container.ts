import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { GenreRepository } from "../repositories/genreRepository.js";
import { GenreUsecase } from "../usecases/genreUsecase.js";
import { StoryRepository } from "../repositories/storyRepository.js";
import { StoryUsecase } from "../usecases/storyUsecase.js";
import { CharacterRepository } from "../repositories/characterRepository.js";
import { CharacterUsecase } from "../usecases/characterUsecase.js";
import { EpisodeRepository } from "../repositories/episodeRepository.js";
import { EpisodeUsecase } from "../usecases/episodeUsecase.js";
import { MaterialGroupRepository } from "../repositories/materialGroupRepository.js";
import { MaterialGroupUsecase } from "../usecases/materialGroupUsecase.js";
import { MaterialRepository } from "../repositories/materialRepository.js";
import { MaterialUsecase } from "../usecases/materialUsecase.js";
import { UserRepository } from "../repositories/userRepository.js";
import { UserUsecase } from "../usecases/userUsecase.js";
import { PanelRepository } from "../repositories/panelRepository.js";
import { PanelUsecase } from "../usecases/panelUsecase.js";
import { PublishSettingsRepository } from "../repositories/publishSettingsRepository.js";
import { PublishSettingsUsecase } from "../usecases/publishSettingsUsecase.js";
import { CharacterRelationshipRepository } from "../repositories/characterRelationshipRepository.js";
import { CharacterRelationshipUsecase } from "../usecases/characterRelationshipUsecase.js";
import { EpisodePageRepository } from "../repositories/episodePageRepository.js";
import { EpisodePageUsecase } from "../usecases/episodePageUsecase.js";
import { JobRepository } from "../repositories/jobRepository.js";
import { JobUsecase } from "../usecases/jobUsecase.js";
import { MastraClient } from "./mastraClient.js";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

export const genreUsecase = new GenreUsecase(new GenreRepository(prisma));
export const storyUsecase = new StoryUsecase(new StoryRepository(prisma));
export const characterUsecase = new CharacterUsecase(new CharacterRepository(prisma));
export const episodeUsecase = new EpisodeUsecase(new EpisodeRepository(prisma), new EpisodePageRepository(prisma));
export const materialGroupUsecase = new MaterialGroupUsecase(new MaterialGroupRepository(prisma));
export const materialUsecase = new MaterialUsecase(new MaterialRepository(prisma));
export const userUsecase = new UserUsecase(new UserRepository(prisma));
export const panelUsecase = new PanelUsecase(new PanelRepository(prisma));
export const publishSettingsUsecase = new PublishSettingsUsecase(
  new PublishSettingsRepository(prisma)
);
export const characterRelationshipUsecase = new CharacterRelationshipUsecase(
  new CharacterRelationshipRepository(prisma)
);
export const episodePageUsecase = new EpisodePageUsecase(new EpisodePageRepository(prisma));
export const jobUsecase = new JobUsecase(new JobRepository(prisma));

export const mastraClient = new MastraClient()
