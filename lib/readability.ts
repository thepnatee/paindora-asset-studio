import { CardRecord } from "./types";

const limits = {
  title: 38,
  situation: 80,
  impact: 60,
  goal: 65,
  behavior: 65,
  constraint: 75,
  description: 80,
  responsibilities: 80,
  question: 70,
} as const;

export type ReadabilityWarning = {
  field: string;
  length: number;
  limit: number;
};

export function readabilityWarnings(card: CardRecord): ReadabilityWarning[] {
  const checks: Array<[keyof typeof limits, string | undefined]> = [
    ["title", card.title],
    ["situation", card.situation],
    ["impact", card.impact],
    ["goal", card.goal],
    ["behavior", card.behavior],
    ["constraint", card.constraint],
    ["description", card.description],
    ["responsibilities", card.responsibilities],
    ["question", card.question],
  ];

  return checks.flatMap(([field, value]) => {
    const length = value?.trim().length ?? 0;
    const limit = limits[field];
    return length > limit ? [{ field, length, limit }] : [];
  });
}

export function displayPoints(value?: string): string[] {
  if (!value) return [];

  const normalized = value
    .split(/[•;\n]+/)
    .map(v => v.trim())
    .filter(Boolean);

  if (normalized.length > 1) return normalized;

  const byComma = value
    .split(/,|，/)
    .map(v => v.trim())
    .filter(Boolean);

  return byComma.length > 1 ? byComma : [value.trim()];
}
