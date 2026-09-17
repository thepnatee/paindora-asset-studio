"use client";

import { useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import cardsSeed from "@/data/cards.json";
import { CardRecord, DeckType, DisplayMode } from "@/lib/types";
import { illustrationPrompt } from "@/lib/prompts";
import { readabilityWarnings } from "@/lib/readability";
import { deckReferenceGuidance } from "@/lib/reference-guidance";
import { projectPlan } from "@/lib/project-plan";
import { CardPreview } from "@/components/CardPreview";

const deckOrder: DeckType[] = ["pain", "persona", "role", "action", "reality"];
const CLIENT_BATCH_SIZE = 6;
const modeOptions: Array<{ value: DisplayMode; label: string; note: string }> = [
  { value: "senior", label: "Senior Friendly", note: "Large type · stronger hierarchy" },
  { value: "standard", label: "Standard", note: "Balanced information density" },
  { value: "lean", label: "Lean Ink", note: "Reduced fills · economical print" },
  { value: "mono", label: "Monochrome", note: "Prototype / low-cost test" },
];

export default function Home() {
  const [cards, setCards] = useState<CardRecord[]>(cardsSeed as CardRecord[]);
  const [selectedId, setSelectedId] = useState(cards[0]?.id ?? "");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("senior");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [referenceImages, setReferenceImages] = useState<Partial<Record<DeckType, string[]>>>({});
  const [generationScope, setGenerationScope] = useState<"missing" | "all">("missing");
  const cardRef = useRef<HTMLDivElement>(null);

  const selected = cards.find(c => c.id === selectedId) ?? cards[0];
  const counts = useMemo(() => Object.fromEntries(deckOrder.map(d => [d, cards.filter(c => c.deck === d).length])), [cards]);
  const warnings = useMemo(() => readabilityWarnings(selected), [selected]);
  const generatedCount = cards.filter(c => Boolean(c.illustrationDataUrl)).length;
  const selectedGuide = deckReferenceGuidance[selected.deck];
  const selectedRefs = referenceImages[selected.deck] ?? [];

  function patch(patchValue: Partial<CardRecord>) {
    setCards(prev => prev.map(c => c.id === selected.id ? { ...c, ...patchValue } : c));
  }

  function friendlyError(error: unknown) {
    const raw = error instanceof Error ? error.message : String(error ?? "Generation failed");
    if (/no credits|billing|quota/i.test(raw)) return "API credit is unavailable. Check OpenAI Platform → Billing, then try again.";
    if (/401|invalid.*key|api key/i.test(raw)) return "API key is invalid or unavailable. Check OPENAI_API_KEY in .env.local.";
    if (/429|rate limit/i.test(raw)) return "Rate limit reached. Wait briefly and retry with a smaller batch.";
    if (/model/i.test(raw) && /not found|does not exist|access/i.test(raw)) return "The configured image model is unavailable for this project. Check OPENAI_IMAGE_MODEL.";
    return raw;
  }

  async function fileToDataUrl(file: File) {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  async function setDeckReferences(deck: DeckType, files: FileList | null) {
    if (!files?.length) return;
    try {
      const picked = Array.from(files).slice(0, 2);
      const next = await Promise.all(picked.map(fileToDataUrl));
      setReferenceImages(prev => ({ ...prev, [deck]: next }));
      setMessage(`${deck.toUpperCase()} reference set loaded: ${next.length} image${next.length > 1 ? "s" : ""}.`);
    } catch (error) {
      setMessage(friendlyError(error));
    }
  }

  async function generateIllustration() {
    setBusy(true); setMessage(`Generating ${selected.id}${selectedRefs.length ? " with style reference" : ""}…`);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: illustrationPrompt(selected),
          referenceImages: selectedRefs,
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Generation failed");
      patch({ illustrationDataUrl: json.dataUrl });
      setMessage(`${selected.id} illustration generated${json.referenceGuided ? ` · reference guided (${json.referenceCount})` : ""}.`);
    } catch (error) {
      setMessage(friendlyError(error));
    } finally { setBusy(false); }
  }

  async function generateCollection(targetCards: CardRecord[], label: string, deckForReference?: DeckType) {
    const target = generationScope === "all" ? targetCards : targetCards.filter(c => !c.illustrationDataUrl);
    if (!target.length) {
      setMessage(`${label} has no missing illustrations.`);
      return;
    }

    const refs = deckForReference ? (referenceImages[deckForReference] ?? []) : [];
    const scopeText = generationScope === "all" ? "REGENERATE ALL" : "GENERATE MISSING";
    const ok = window.confirm(
      `${scopeText}: ${target.length} illustration${target.length === 1 ? "" : "s"} for ${label}?\n\n` +
      `Batch size: ${CLIENT_BATCH_SIZE}. ${refs.length ? `Style reference: ${refs.length} image(s). ` : "No uploaded style reference. "}` +
      `API usage may incur cost.`,
    );
    if (!ok) return;

    setBusy(true);
    try {
      let completed = 0;
      let failed = 0;
      for (let i = 0; i < target.length; i += CLIENT_BATCH_SIZE) {
        const chunk = target.slice(i, i + CLIENT_BATCH_SIZE);
        setMessage(`Generating ${label}: ${completed + 1}–${completed + chunk.length} of ${target.length}…`);

        const response = await fetch("/api/generate-batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: chunk.map(card => ({ id: card.id, prompt: illustrationPrompt(card) })),
            referenceImages: refs,
          }),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || "Batch generation failed");

        const resultMap = new Map<string, string>();
        const failures: string[] = [];
        for (const item of json.items ?? []) {
          if (item.dataUrl) resultMap.set(item.id, item.dataUrl);
          if (item.error) failures.push(item.id);
        }
        failed += failures.length;

        setCards(prev => prev.map(card => {
          const dataUrl = resultMap.get(card.id);
          return dataUrl ? { ...card, illustrationDataUrl: dataUrl } : card;
        }));

        completed += chunk.length;
      }
      setMessage(`Finished ${label}. ${target.length - failed} generated${failed ? ` · ${failed} failed` : ""}${refs.length ? " · reference guided" : ""}.`);
    } catch (error) {
      setMessage(friendlyError(error));
    } finally {
      setBusy(false);
    }
  }

  async function exportPng() {
    if (!cardRef.current) return;
    setMessage(`Rendering ${selected.id} PNG…`);
    const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${selected.id}-${displayMode}.png`;
    a.click();
    setMessage(`${selected.id} PNG exported.`);
  }

  async function exportDeckZip() {
    setBusy(true); setMessage("Rendering deck ZIP…");
    try {
      const deckCards = cards.filter(c => c.deck === selected.deck);
      const originalId = selectedId;
      const zip = new JSZip();
      for (const card of deckCards) {
        setSelectedId(card.id);
        await new Promise(r => setTimeout(r, 140));
        if (!cardRef.current) continue;
        const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
        zip.file(`${card.id}-${displayMode}.png`, dataUrl.split(",")[1], { base64: true });
      }
      setSelectedId(originalId);
      const blob = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `paindora-${selected.deck}-${displayMode}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
      setMessage("Deck ZIP exported.");
    } finally { setBusy(false); }
  }

  function importJson(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const next = JSON.parse(String(reader.result));
        if (!Array.isArray(next)) throw new Error("Expected an array");
        setCards(next);
        setSelectedId(next[0]?.id ?? "");
        setMessage(`Imported ${next.length} cards.`);
      } catch (error) { setMessage(friendlyError(error)); }
    };
    reader.readAsText(file);
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div><div className="eyebrow">PAINDORA BOX</div><h1>Asset Studio</h1></div>
        <div className="top-actions">
          <label className="button secondary">Import JSON<input hidden type="file" accept="application/json" onChange={e => e.target.files?.[0] && importJson(e.target.files[0])} /></label>
          <button className="button secondary" onClick={() => navigator.clipboard.writeText(JSON.stringify(cards, null, 2))}>Copy JSON</button>
        </div>
      </header>

      <section className="stats">{deckOrder.map(d => <div key={d} className="stat"><span>{d.toUpperCase()}</span><b>{counts[d]}</b></div>)}</section>

      <div className="workspace">
        <aside className="sidebar">
          <div className="section-title">Cards</div>
          {deckOrder.map(deck => <div key={deck} className="deck-group">
            <div className="deck-title">{deck}</div>
            {cards.filter(c => c.deck === deck).map(card => <button key={card.id} className={`card-item ${selectedId === card.id ? "active" : ""}`} onClick={() => setSelectedId(card.id)}><span>{card.id}</span><small>{card.title}</small></button>)}
          </div>)}
        </aside>

        <section className="editor">
          <div className="section-title">Data Editor</div>
          <label>ID<input value={selected.id} disabled /></label>
          <label>Title<input value={selected.title} onChange={e => patch({ title: e.target.value })} /></label>
          {selected.deck === "persona" && <><label>Identity<input value={selected.identity ?? ""} onChange={e => patch({ identity: e.target.value })} /></label><label>Goal<textarea value={selected.goal ?? ""} onChange={e => patch({ goal: e.target.value })} /></label><label>Behavior<textarea value={selected.behavior ?? ""} onChange={e => patch({ behavior: e.target.value })} /></label><label>Constraint<textarea value={selected.constraint ?? ""} onChange={e => patch({ constraint: e.target.value })} /></label></>}
          {selected.deck === "pain" && <><label>Situation<textarea value={selected.situation ?? ""} onChange={e => patch({ situation: e.target.value })} /></label><label>Impact<textarea value={selected.impact ?? ""} onChange={e => patch({ impact: e.target.value })} /></label></>}
          {selected.deck === "role" && <label>Responsibilities<textarea value={selected.responsibilities ?? ""} onChange={e => patch({ responsibilities: e.target.value })} /></label>}
          {selected.deck === "action" && <><label>Description<textarea value={selected.description ?? ""} onChange={e => patch({ description: e.target.value })} /></label><label>Role Requirement<input value={selected.roleRule ?? ""} onChange={e => patch({ roleRule: e.target.value })} /></label></>}
          {selected.deck === "reality" && <><label>Situation<textarea value={selected.situation ?? ""} onChange={e => patch({ situation: e.target.value })} /></label><label>What changes now?<textarea value={selected.question ?? ""} onChange={e => patch({ question: e.target.value })} /></label></>}

          <div className="readability-box"><div className="readability-head"><b>Senior readability</b><span>{warnings.length ? `${warnings.length} warning${warnings.length > 1 ? "s" : ""}` : "Ready"}</span></div>{warnings.length ? warnings.map(w => <div className="readability-warning" key={w.field}>⚠ {w.field}: {w.length}/{w.limit} chars</div>) : <div className="readability-ok">✓ Copy length is suitable for the large-type layout.</div>}</div>

          <div className="section-title generator-title">Generator Center</div>
          <div className="mode-grid">{modeOptions.map(mode => <button key={mode.value} className={`mode-option ${displayMode === mode.value ? "active" : ""}`} onClick={() => setDisplayMode(mode.value)}><b>{mode.label}</b><small>{mode.note}</small></button>)}</div>

          <div className="reference-box">
            <div className="reference-head"><div><b>Style Reference · {selectedGuide.label}</b><small>Recommended master refs: {selectedGuide.recommendedRefs.length ? selectedGuide.recommendedRefs.join(" + ") : "create master reference"}</small></div><span>{selectedRefs.length}/2 loaded</span></div>
            <p>{selectedGuide.styleNotes}</p>
            <label className="button secondary reference-upload">Upload up to 2 references<input hidden type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={e => setDeckReferences(selected.deck, e.target.files)} /></label>
            {selectedRefs.length > 0 && <div className="reference-thumbs">{selectedRefs.map((src, i) => <img key={i} src={src} alt={`${selected.deck} reference ${i + 1}`} />)}<button className="tiny-button" onClick={() => setReferenceImages(prev => ({ ...prev, [selected.deck]: [] }))}>Clear</button></div>}
          </div>

          <label>Illustration Prompt<textarea rows={7} value={illustrationPrompt(selected)} readOnly /></label>
          <div className="generator-actions"><button className="button" disabled={busy} onClick={generateIllustration}>{busy ? "Working…" : "Generate This Illustration"}</button></div>

          <div className="deck-generator-box">
            <div className="deck-generator-head"><b>Generate complete card type</b><select value={generationScope} onChange={e => setGenerationScope(e.target.value as "missing" | "all")}><option value="missing">Missing only</option><option value="all">Regenerate full set</option></select></div>
            <div className="deck-generator-grid">{deckOrder.map(deck => {
              const deckCards = cards.filter(c => c.deck === deck);
              const refs = referenceImages[deck]?.length ?? 0;
              return <button key={deck} className="deck-generate-button" disabled={busy} onClick={() => generateCollection(deckCards, `${deck.toUpperCase()} (${deckCards.length})`, deck)}><b>{deck.toUpperCase()}</b><small>{deckCards.length} cards · {refs ? `${refs} ref` : "text only"}</small></button>;
            })}</div>
          </div>

          <div className="cost-note">Cost guard · batch {CLIENT_BATCH_SIZE} · {generatedCount}/{cards.length} illustrations generated · reference images are reused across the selected deck.</div>

          <div className="capability-box"><b>Project status & targets</b><div className="plan-column"><strong>Done</strong>{projectPlan.completed.slice(-4).map(item => <small key={item}>✓ {item}</small>)}</div><div className="plan-column"><strong>Current</strong>{projectPlan.current.map(item => <small key={item}>→ {item}</small>)}</div><div className="plan-column"><strong>Next target</strong>{projectPlan.nextTargets.slice(0, 5).map(item => <small key={item}>○ {item}</small>)}</div></div>
          <div className="message" role="status">{message}</div>
        </section>

        <section className="preview-panel">
          <div className="preview-head"><div><div className="section-title">Print Preview</div><div className="preview-mode">{modeOptions.find(m => m.value === displayMode)?.label}</div></div><div className="preview-actions"><button className="button secondary" onClick={exportPng}>Export PNG</button><button className="button secondary" disabled={busy} onClick={exportDeckZip}>Export Deck ZIP</button></div></div>
          <div className="preview-stage"><CardPreview ref={cardRef} card={selected} displayMode={displayMode} /></div>
          <div className="spec-note">Trim 70×110 mm · Artwork 76×116 mm · 3 mm bleed · 5 mm safe area · render ratio 19:29</div>
        </section>
      </div>
    </main>
  );
}
