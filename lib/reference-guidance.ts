import { DeckType } from "./types";

export type DeckReferenceGuide = {
  label: string;
  recommendedRefs: string[];
  styleNotes: string;
};

export const deckReferenceGuidance: Record<DeckType, DeckReferenceGuide> = {
  pain: {
    label: "PAINDORA Pain v1",
    recommendedRefs: ["PA01", "PA03"],
    styleNotes:
      "Match the supplied PAINDORA Pain references: warm editorial cartoon scene, rounded friendly character proportions, contextual environment and props, soft flat-to-soft-3D shading, deep navy + coral as the main CI accents, warm neutral supporting colors. Show the pain through a human situation, not an isolated icon. Do not copy card text, header, footer, logo, or typography from the reference.",
  },
  persona: {
    label: "PAINDORA Persona v1",
    recommendedRefs: ["PR13", "PR18"],
    styleNotes:
      "Match the supplied PAINDORA Persona references: warm editorial character illustration, rounded proportions, clear facial expression, contextual workplace/community environment, meaningful props, soft flat-to-soft-3D shading, deep navy + human blue as the main CI accents, natural muted supporting colors. Do not copy card text, header, footer, logo, or typography from the reference.",
  },
  role: {
    label: "PAINDORA Role v1",
    recommendedRefs: [],
    styleNotes:
      "Use the PAINDORA house style: professional warm editorial character/workspace scene, rounded shapes, contextual tools, soft flat shading, deep navy + purple/indigo accent, transparent background, no card frame or text.",
  },
  action: {
    label: "PAINDORA Action v1",
    recommendedRefs: [],
    styleNotes:
      "Use the PAINDORA house style: professional editorial action/process scene, clear human activity or symbolic task, rounded shapes, soft flat shading, deep navy + product green accent, transparent background, no card frame or text.",
  },
  reality: {
    label: "PAINDORA Reality v1",
    recommendedRefs: [],
    styleNotes:
      "Use the PAINDORA house style: contextual disruption/change scene, clear consequence, rounded shapes, soft flat shading, deep navy + amber/orange accent, transparent background, no card frame or text.",
  },
};
