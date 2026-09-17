import { DeckType } from "./types";

export const printSpec = {
  trimMm: { width: 70, height: 110 },
  bleedMm: 3,
  artworkMm: { width: 76, height: 116 },
  safeAreaMm: 5,
  dpi: 300,
  renderPx: { width: 912, height: 1392 }, // exact 19:29 ratio
};

export const ci = {
  navy: "#0B2D5B",
  warmWhite: "#FFF9F2",
  ink: "#10233F",
  muted: "#6B7A90",
  deck: {
    pain: "#EF5B5B",
    persona: "#3B82F6",
    role: "#8B5CF6",
    action: "#10B981",
    reality: "#F59E0B",
  } satisfies Record<DeckType, string>,
};

export const deckLabels: Record<DeckType, string> = {
  pain: "PAIN",
  persona: "PERSONA",
  role: "ROLE",
  action: "ACTION",
  reality: "REALITY",
};
