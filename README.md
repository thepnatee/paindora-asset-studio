# PAINDORA Asset Studio

Template-driven production system for PAINDORA BOX cards and workshop assets.

## Why this exists

AI should generate **illustrations**, not the final card text/layout. The app keeps CI, exact card ratio, Thai copy, deck rules and export consistent while allowing AI illustrations to be generated on demand.

## Current MVP

- Full production dataset: **96 front cards**
  - Pain 18
  - Persona 24
  - Role 14
  - Action 20
  - Reality 20
- Live card editor + print preview
- Senior-friendly readability mode as the default
- Four output styles:
  - Senior Friendly
  - Standard
  - Lean Ink
  - Monochrome Prototype
- Readability warnings for overlong copy
- Lean CI: navy + warm white + one deck accent
- Server-side OpenAI image generation with transparent background
- Single illustration generation
- Missing-only deck batch generation
- Missing-only all-deck generation
- Default client batch size: 6
- Server-side batch cap via `OPENAI_BATCH_MAX`
- Existing generated illustrations are skipped during batch generation
- Friendly API/billing/rate-limit error messages
- Per-card PNG export
- Deck ZIP export
- JSON import/copy for bulk data workflows
- GitHub Actions validation/build
- Production dataset validation with exact deck counts and content contracts

## Run locally

```bash
cp .env.example .env.local
# put your own key in .env.local
npm install
npm run dev -- -p 3005
```

Open http://localhost:3005

## Environment

```env
OPENAI_API_KEY=your_key_here
OPENAI_IMAGE_MODEL=gpt-image-2
OPENAI_IMAGE_SIZE=912x1392
OPENAI_IMAGE_QUALITY=low
OPENAI_BATCH_MAX=6
```

The image API endpoint is server-side, so the browser never receives the API key.

`OPENAI_IMAGE_QUALITY=low` is the lean-cost default. Increase it only for approved final illustrations.

## Production dimensions

- Trim: 70 × 110 mm
- Bleed: 3 mm on all sides
- Artwork: 76 × 116 mm
- Safe area: 5 mm inside trim
- Target print resolution: 300 dpi
- Generator canvas/reference ratio: 19:29

> The image generator is used only for transparent illustrations. Final card typography/layout is rendered by code for consistency and production control.

## Accessibility / senior-friendly rules

The Senior Friendly mode intentionally gives text more space and reduces the illustration area. It also uses stronger contrast, larger body copy and larger footer chips.

The UI warns when copy exceeds these targets:

- Title: 38 characters
- Situation: 80
- Impact: 60
- Goal: 65
- Behavior: 65
- Constraint: 75
- Description / Responsibility: 80
- Reality question: 70

The goal is to **shorten copy instead of shrinking type**.

## Generator Center

The Studio currently generates:

1. AI illustration for one card
2. missing illustrations for the current deck
3. all missing illustrations across all 96 cards
4. final rendered card fronts in four visual modes
5. individual PNG files
6. deck ZIP packages

The UI always asks for confirmation before paid batch image generation. Existing illustrations are skipped.

## Data

`data/cards.json` is the production source of truth for all 96 card fronts. The schema is in `lib/types.ts`.

Validate it with:

```bash
npm run validate:data
```

The validator checks:

- unique IDs
- exact deck counts
- total = 96 cards
- Persona required fields
- Pain content contract
- Action role requirements
- Reality cards have no A/B/C options

## Recommended Git workflow

- `main`: approved production baseline
- feature branches: design/data/generator changes
- release tags: `v0.1-playtest`, `v0.2-balance`, `v1.0-print`

## Next additions

- 5 reusable card-back templates
- server-side print PDF generation
- print-sheet imposition / crop marks in prepress only
- Product Sprint Board A2
- Resource Tracker
- Decision Log
- Understand / Build / Pitch Canvas
- Reflection Sheet
- save generated illustrations outside browser state
- Vercel deployment
