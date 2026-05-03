import type { PanelRepository } from "../repositories/panelRepository.js";
import type { SavePanelsInput } from "../schemas/panel.js";

export class PanelUsecase {
  constructor(private readonly repo: PanelRepository) {}

  getPanels(storyId: number) {
    return this.repo.findByStoryId(storyId);
  }

  savePanels(storyId: number, input: SavePanelsInput) {
    return this.repo.save(storyId, input);
  }
}
