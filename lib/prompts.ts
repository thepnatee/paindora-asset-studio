import { CardRecord } from "./types";

const base = `PAINDORA BOX visual identity: professional, warm, collaborative, modern corporate workshop toolkit. Lean production design. Use navy, warm white and ONE deck accent only. Flat editorial illustration, minimal shading, no gradients unless subtle, no chibi, no fantasy, no mockup, no table, no card frame, transparent background. Generate ONLY the standalone illustration asset. Keep it simple enough for economical printing and consistent across a whole deck.`;

export function illustrationPrompt(card: CardRecord) {
  if (card.illustrationPrompt) return card.illustrationPrompt;

  if (card.deck === "persona") {
    return `${base} Persona ${card.id}: ${card.title}. ${card.identity ?? ""}. Goal: ${card.goal ?? ""}. Behavior: ${card.behavior ?? ""}. Constraint: ${card.constraint ?? ""}. Create one waist-up character scene with at most 2 supporting objects that clearly communicate the persona. Transparent background.`;
  }
  if (card.deck === "pain") {
    return `${base} Pain ${card.id}: ${card.title}. Situation: ${card.situation ?? ""}. Create one abstract editorial metaphor icon/scene for the friction. No people unless essential. Transparent background.`;
  }
  if (card.deck === "role") {
    return `${base} Role ${card.id}: ${card.title}. Capabilities: ${(card.capabilities ?? []).join(", ")}. Create one professional character or symbolic workspace illustration. Transparent background.`;
  }
  if (card.deck === "action") {
    return `${base} Action ${card.id}: ${card.title}. ${card.description ?? ""}. Create one simple symbolic action illustration, not a UI screenshot. Transparent background.`;
  }
  return `${base} Reality ${card.id}: ${card.title}. Situation: ${card.situation ?? ""}. Create one simple disruption/constraint illustration. Transparent background.`;
}
