import { CardRecord } from "./types";
import { deckReferenceGuidance } from "./reference-guidance";

const globalRules = `PAINDORA BOX illustration asset only. Professional, warm, collaborative corporate workshop visual language. Generate ONLY the standalone illustration artwork for placement inside a card template. Transparent background. No text, no letters, no numbers, no logo, no card frame, no header, no footer, no UI screenshot, no mockup. Keep the composition centered and card-friendly with breathing room around the subject. Use a contextual editorial scene rather than a floating icon whenever a human situation can explain the idea better.`;

export function illustrationPrompt(card: CardRecord) {
  if (card.illustrationPrompt) return card.illustrationPrompt;

  const guide = deckReferenceGuidance[card.deck];
  const style = `Reference direction: ${guide.styleNotes}`;

  if (card.deck === "persona") {
    return `${globalRules}\n${style}\nPersona ${card.id}: ${card.title}. Identity: ${card.identity ?? ""}. Goal: ${card.goal ?? ""}. Behavior: ${card.behavior ?? ""}. Constraint: ${card.constraint ?? ""}. Show one clear human subject in their real context with 2–4 meaningful supporting objects/environment cues. Make the visual tell the persona story immediately without any written labels.`;
  }
  if (card.deck === "pain") {
    return `${globalRules}\n${style}\nPain ${card.id}: ${card.title}. Situation: ${card.situation ?? ""}. Impact: ${card.impact ?? ""}. Depict the friction as a contextual human scene with one primary character when appropriate, plus simple supporting objects that make the problem obvious. Avoid isolated hourglass/package/icon-only compositions unless the pain truly has no human context.`;
  }
  if (card.deck === "role") {
    return `${globalRules}\n${style}\nRole ${card.id}: ${card.title}. Capabilities: ${(card.capabilities ?? []).join(", ")}. Responsibilities: ${card.responsibilities ?? ""}. Create one professional character/workspace scene that makes the role instantly recognizable through tools and work context.`;
  }
  if (card.deck === "action") {
    return `${globalRules}\n${style}\nAction ${card.id}: ${card.title}. ${card.description ?? ""}. Phase: ${card.phase ?? ""}. Create one clear action/process scene showing what the team is doing. Prefer people + process artifacts over a standalone symbol.`;
  }
  return `${globalRules}\n${style}\nReality ${card.id}: ${card.title}. Situation: ${card.situation ?? ""}. What changes now: ${card.question ?? ""}. Create one contextual disruption/change scene showing pressure, constraint, or consequence clearly.`;
}
