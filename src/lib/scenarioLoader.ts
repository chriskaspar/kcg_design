import type { SavedScenario } from "../types/architecture";

const modules = import.meta.glob("../data/scenarios/*.json", { eager: true });

export const staticScenarioLibrary: SavedScenario[] = Object.values(modules).map(
  (m) => (m as { default: SavedScenario }).default
);
