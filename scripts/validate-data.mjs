import fs from "node:fs";
import path from "node:path";

const p = path.join(process.cwd(), "data/cards.json");
const cards = JSON.parse(fs.readFileSync(p, "utf8"));
const ids = new Set();
const allowed = new Set(["pain","persona","role","action","reality"]);
const expectedCounts = { pain: 18, persona: 24, role: 14, action: 20, reality: 20 };
let errors = [];

for (const card of cards) {
  if (!card.id) errors.push("Missing id");
  if (ids.has(card.id)) errors.push(`Duplicate id: ${card.id}`);
  ids.add(card.id);
  if (!allowed.has(card.deck)) errors.push(`${card.id}: invalid deck ${card.deck}`);
  if (!card.title) errors.push(`${card.id}: missing title`);

  if (card.deck === "pain") {
    if (!card.situation || !card.impact || !card.difficulty || !card.minimumAction) {
      errors.push(`${card.id}: incomplete pain card`);
    }
    if (card.identity || card.goal || card.roleRule) {
      errors.push(`${card.id}: pain contains persona/role fields that should not be present`);
    }
  }

  if (card.deck === "persona") {
    if (!card.identity || !card.goal || !card.behavior || !card.constraint || !card.digitalConfidence) {
      errors.push(`${card.id}: incomplete persona`);
    }
  }

  if (card.deck === "role") {
    if (!Array.isArray(card.capabilities) || !card.capabilities.length || !card.responsibilities) {
      errors.push(`${card.id}: incomplete role`);
    }
  }

  if (card.deck === "action") {
    if (!card.description || !card.level || !card.phase || !card.roleRule) {
      errors.push(`${card.id}: incomplete action`);
    }
    if (!Array.isArray(card.compatibleRoles) || !card.compatibleRoles.length) {
      errors.push(`${card.id}: action missing compatibleRoles`);
    }
  }

  if (card.deck === "reality") {
    if (!card.situation || !card.question) errors.push(`${card.id}: incomplete reality card`);
    const serialized = JSON.stringify(card).toLowerCase();
    if (serialized.includes('"choices"') || serialized.includes('"options"')) {
      errors.push(`${card.id}: reality card must not contain A/B/C choices`);
    }
  }
}

for (const [deck, expected] of Object.entries(expectedCounts)) {
  const actual = cards.filter(card => card.deck === deck).length;
  if (actual !== expected) errors.push(`${deck}: expected ${expected} cards, found ${actual}`);
}

if (cards.length !== 96) errors.push(`Expected 96 total cards, found ${cards.length}`);

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Validated PAINDORA production dataset:");
for (const [deck, expected] of Object.entries(expectedCounts)) {
  console.log(`  ${deck}: ${expected}`);
}
console.log(`  total: ${cards.length}`);
