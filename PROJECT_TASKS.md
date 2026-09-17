# PAINDORA Asset Studio — Task & Target

## Done

- [x] Seed complete production dataset: Pain 18 / Persona 24 / Role 14 / Action 20 / Reality 20
- [x] Add Senior Friendly card mode and readability warnings
- [x] Add Standard / Senior / Lean Ink / Monochrome render modes
- [x] Add single illustration generation
- [x] Add cost-confirmed missing-only deck batch generation
- [x] Add single PNG and deck ZIP export
- [x] Add friendly OpenAI billing / API key / rate-limit errors
- [x] Preserve production ratio: trim 70×110 mm / artwork 76×116 mm / 3 mm bleed

## Current implementation

- [x] Add deck-level visual reference guidance
- [x] Update Pain prompt from icon/metaphor-first to contextual human scene
- [x] Update Persona prompt to approved warm editorial visual language
- [x] Support up to 2 uploaded reference images per deck
- [x] Use image edit when reference images are supplied; fall back to text generation otherwise
- [x] Add explicit generate-by-card-type controls for all 5 decks
- [x] Add Missing Only / Regenerate Full Set modes
- [x] Reuse the same reference set through a whole deck batch
- [x] Show task/status/next targets inside Asset Studio

## Approved reference direction

- Pain: use PA01 + PA03 as recommended master references
- Persona: use PR13 + PR18 as recommended master references
- Role: master reference still required
- Action: master reference still required
- Reality: master reference still required

## New targets

- [ ] Create and approve Role master reference
- [ ] Create and approve Action master reference
- [ ] Create and approve Reality master reference
- [ ] Persist generated illustrations outside browser state
- [ ] Add five reusable card-back templates
- [ ] Add print-ready PDF export with bleed and optional crop marks
- [ ] Add print-sheet imposition for economical printing
- [ ] Add Product Sprint Board A2 generator
- [ ] Add Resource Tracker and Decision Log
- [ ] Add Understand / Build / Pitch canvases
- [ ] Add Reflection Sheet and facilitator assets
- [ ] Add one-click Workshop Kit export

## Product target

**PAINDORA Asset Studio should become a template-driven workshop-kit production system:**

`Data → Reference-guided illustration → Code-rendered card → Deck / toolkit export → Print-ready package`

AI generates only the illustration layer. Text, layout, card rules, print dimensions, and CI stay deterministic in code.
