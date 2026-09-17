# PAINDORA Asset Studio

Template-driven production system for PAINDORA BOX cards and workshop assets.

## Why this exists

AI should generate **illustrations**, not the final card text/layout. The app keeps CI, exact card ratio, Thai copy, deck rules and export consistent while allowing AI illustrations to be generated on demand.

## MVP features

- Pain / Persona / Role / Action / Reality data model
- Live card editor + preview
- Lean CI: navy + warm white + one deck accent
- OpenAI image generation route with transparent background
- Exact illustration API target ratio `912x1392` = 19:29, matching artwork `76x116 mm`
- Per-card PNG export
- Deck ZIP export
- JSON import/copy for bulk data workflows
- GitHub Actions validation/build

## Run locally

```bash
cp .env.example .env.local
# put your own key in .env.local
npm install
npm run dev
```

Open http://localhost:3000

## Environment

```env
OPENAI_API_KEY=your_key_here
OPENAI_IMAGE_MODEL=gpt-image-2.5-flare
OPENAI_IMAGE_SIZE=912x1392
```

The image API endpoint is server-side, so the browser never receives the API key.

## Production dimensions

- Trim: 70 × 110 mm
- Bleed: 3 mm on all sides
- Artwork: 76 × 116 mm
- Safe area: 5 mm inside trim
- Target print resolution: 300 dpi
- Generator canvas/reference ratio: 19:29

> The image generator is used only for transparent illustrations. Final card typography/layout is rendered by code for consistency and production control.

## Data

`data/cards.json` contains sample records. Replace it with the full PAINDORA dataset or import JSON in the UI. The schema is in `lib/types.ts`.

## Recommended Git workflow

- `main`: approved production baseline
- `develop`: ongoing balance/design work
- release tags: `v0.1-playtest`, `v0.2-balance`, `v1.0-print`

## Next recommended additions

- full 96-card seed data import from the existing workbook
- batch image generation with concurrency + cost guard
- server-side print PDF generation
- card-back templates
- print-sheet imposition / crop marks in prepress only
- Vercel deployment
# paindora-asset-studio
