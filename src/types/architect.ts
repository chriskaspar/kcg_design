export type ArchitectTabId = "WHY" | "GOAL" | "SAFE" | "FLOW" | "DATA" | "FAST" | "RUN" | "WIN" | "STORY";

export interface ArchitectQuestion {
  id: string;
  letter: string;
  meaning: string;
  question: string;
}

export interface ArchitectTabDefinition {
  id: ArchitectTabId;
  word: string;
  stage: string;
  description: string;
  questions: ArchitectQuestion[];
}

export type ArchitectAnswers = Record<string, string>;

export interface StoryOutput {
  strategy: string;
  technology: string;
  outcome: string;
  returnValue: string;
  years: string;
}
