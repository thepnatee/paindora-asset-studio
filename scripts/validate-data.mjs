import fs from "node:fs";
import path from "node:path";

const p = path.join(process.cwd(), "data/cards.json");
const cards = JSON.parse(fs.readFileSync(p, "utf8"));
const ids = new Set();
const allowed = new Set(["pain","persona","role","action","reality"]);
let errors = [];

for (const card of cards) {
  if (!card.id) errors.push("Missing id");
  if (ids.has(card.id)) errors.push(`Duplicate id: ${card.id}`);
  ids.add(card.id);
  if (!allowed.has(card.deck)) errors.push(`${card.id}: invalid deck ${card.deck}`);
  if (!card.title) errors.push(`${card.id}: missing title`);
  if (card.deck === "action" && !card.roleRule) errors.push(`${card.id}: action missing roleRule`);
  if (card.deck === "reality" && !card.question) errors.push(`${card.id}: reality missing question`);
  if (card.deck === "persona" && (!card.goal || !card.behavior || !card.constraint)) errors.push(`${card.id}: incomplete persona`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Validated ${cards.length} cards.`);
