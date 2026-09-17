"use client";

import { useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import cardsSeed from "@/data/cards.json";
import { CardRecord, DeckType, DisplayMode } from "@/lib/types";
import { illustrationPrompt } from "@/lib/prompts";
import { readabilityWarnings } from "@/lib/readability";
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
  const cardRef = useRef<HTMLDivElement>(null);

  const selected = cards.find(c => c.id === selectedId) ?? cards[0];
  const counts = useMemo(() => Object.fromEntries(deckOrder.map(d => [d, cards.filter(c => c.deck === d).length])), [cards]);
  const warnings = useMemo(() => readabilityWarnings(selected), [selected]);
  const generatedCount = cards.filter(c => Boolean(c.illustrationDataUrl)).length;

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

  async function generateIllustration() {
    setBusy(true); setMessage(`Generating ${selected.id} illustration…`);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: illustrationPrompt(selected) }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Generation failed");
      patch({ illustrationDataUrl: json.dataUrl });
      setMessage(`${selected.id} illustration generated.`);
    } catch (error) {
      setMessage(friendlyError(error));
    } finally { setBusy(false); }
  }

  async function generateCollection(targetCards: CardRecord[], label: string) {
    const pending = targetCards.filter(c => !c.illustrationDataUrl);
    if (!pending.length) {
      setMessage(`${label} has no missing illustrations.`);
      return;
    }

    const ok = window.confirm(
      `Generate ${pending.length} missing illustration${pending.length === 1 ? "" : "s"} for ${label}?\n\n` +
      `Batch size: ${CLIENT_BATCH_SIZE}. Existing illustrations are skipped. API usage may incur cost.`,
    );
    if (!ok) return;

    setBusy(true);
    try {
      let completed = 0;
      let failed = 0;
      for (let i = 0; i < pending.length; i += CLIENT_BATCH_SIZE) {
        const chunk = pending.slice(i, i + CLIENT_BATCH_SIZE);
        setMessage(`Generating ${label}: ${completed + 1}–${completed + chunk.length} of ${pending.length}…`);

        const response = await fetch("/api/generate-batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: chunk.map(card => ({ id: card.id, prompt: illustrationPrompt(card) })),
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
      setMessage(`Finished ${label}. ${pending.length - failed} generated${failed ? ` · ${failed} failed` : ""}.`);
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
        <div>
          <div className="eyebrow">PAINDORA BOX</div>
          <h1>Asset Studio</h1>
        </div>
        <div className="top-actions">
          <label className="button secondary">Import JSON<input hidden type="file" accept="application/json" onChange={e => e.target.files?.[0] && importJson(e.target.files[0])} /></label>
          <button className="button secondary" onClick={() => navigator.clipboard.writeText(JSON.stringify(cards, null, 2))}>Copy JSON</button>
        </div>
      </header>

      <section className="stats">
        {deckOrder.map(d => <div key={d} className="stat"><span>{d.toUpperCase()}</span><b>{counts[d]}</b></div>)}
      </section>

      <div className="workspace">
        <aside className="sidebar">
          <div className="section-title">Cards</div>
          {deckOrder.map(deck => (
            <div key={deck} className="deck-group">
              <div className="deck-title">{deck}</div>
              {cards.filter(c => c.deck === deck).map(card => (
                <button key={card.id} className={`card-item ${selectedId === card.id ? "active" : ""}`} onClick={() => setSelectedId(card.id)}>
                  <span>{card.id}</span><small>{card.title}</small>
                </button>
              ))}
            </div>
          ))}
        </aside>

        <section className="editor">
          <div className="section-title">Data Editor</div>
          <label>ID<input value={selected.id} disabled /></label>
          <label>Title<input value={selected.title} onChange={e => patch({ title: e.target.value })} /></label>

          {selected.deck === "persona" && <>
            <label>Identity<input value={selected.identity ?? ""} onChange={e => patch({ identity: e.target.value })} /></label>
            <label>Goal<textarea value={selected.goal ?? ""} onChange={e => patch({ goal: e.target.value })} /></label>
            <label>Behavior<textarea value={selected.behavior ?? ""} onChange={e => patch({ behavior: e.target.value })} /></label>
            <label>Constraint<textarea value={selected.constraint ?? ""} onChange={e => patch({ constraint: e.target.value })} /></label>
          </>}
          {selected.deck === "pain" && <>
            <label>Situation<textarea value={selected.situation ?? ""} onChange={e => patch({ situation: e.target.value })} /></label>
            <label>Impact<textarea value={selected.impact ?? ""} onChange={e => patch({ impact: e.target.value })} /></label>
          </>}
          {selected.deck === "role" && <>
            <label>Responsibilities<textarea value={selected.responsibilities ?? ""} onChange={e => patch({ responsibilities: e.target.value })} /></label>
          </>}
          {selected.deck === "action" && <>
            <label>Description<textarea value={selected.description ?? ""} onChange={e => patch({ description: e.target.value })} /></label>
            <label>Role Requirement<input value={selected.roleRule ?? ""} onChange={e => patch({ roleRule: e.target.value })} /></label>
          </>}
          {selected.deck === "reality" && <>
            <label>Situation<textarea value={selected.situation ?? ""} onChange={e => patch({ situation: e.target.value })} /></label>
            <label>What changes now?<textarea value={selected.question ?? ""} onChange={e => patch({ question: e.target.value })} /></label>
          </>}

          <div className="readability-box">
            <div className="readability-head"><b>Senior readability</b><span>{warnings.length ? `${warnings.length} warning${warnings.length > 1 ? "s" : ""}` : "Ready"}</span></div>
            {warnings.length ? warnings.map(w => (
              <div className="readability-warning" key={w.field}>⚠ {w.field}: {w.length}/{w.limit} chars</div>
            )) : <div className="readability-ok">✓ Copy length is suitable for the large-type layout.</div>}
          </div>

          <div className="section-title generator-title">Generator Center</div>
          <div className="mode-grid">
            {modeOptions.map(mode => (
              <button key={mode.value} className={`mode-option ${displayMode === mode.value ? "active" : ""}`} onClick={() => setDisplayMode(mode.value)}>
                <b>{mode.label}</b><small>{mode.note}</small>
              </button>
            ))}
          </div>

          <label>Illustration Prompt<textarea rows={7} value={illustrationPrompt(selected)} readOnly /></label>
          <div className="generator-actions">
            <button className="button" disabled={busy} onClick={generateIllustration}>{busy ? "Working…" : "Generate This Illustration"}</button>
            <button className="button secondary" disabled={busy} onClick={() => generateCollection(cards.filter(c => c.deck === selected.deck), selected.deck.toUpperCase())}>Generate Missing in Deck</button>
            <button className="button secondary" disabled={busy} onClick={() => generateCollection(cards, "ALL DECKS")}>Generate All Missing</button>
          </div>
          <div className="cost-note">Cost guard · batch {CLIENT_BATCH_SIZE} · {generatedCount}/{cards.length} illustrations generated · existing images are skipped.</div>

          <div className="capability-box">
            <b>What this studio can generate</b>
            <div className="capability-row"><span>✓</span><div><strong>Illustrations</strong><small>Single card · current deck · all missing</small></div></div>
            <div className="capability-row"><span>✓</span><div><strong>Card fronts</strong><small>Standard · Senior · Lean Ink · Monochrome</small></div></div>
            <div className="capability-row"><span>✓</span><div><strong>Production exports</strong><small>Single PNG · deck ZIP</small></div></div>
            <div className="capability-row muted"><span>→</span><div><strong>Next</strong><small>Card backs · print PDF · board · canvases · trackers</small></div></div>
          </div>
          <div className="message" role="status">{message}</div>
        </section>

        <section className="preview-panel">
          <div className="preview-head">
            <div>
              <div className="section-title">Print Preview</div>
              <div className="preview-mode">{modeOptions.find(m => m.value === displayMode)?.label}</div>
            </div>
            <div className="preview-actions">
              <button className="button secondary" onClick={exportPng}>Export PNG</button>
              <button className="button secondary" disabled={busy} onClick={exportDeckZip}>Export Deck ZIP</button>
            </div>
          </div>
          <div className="preview-stage"><CardPreview ref={cardRef} card={selected} displayMode={displayMode} /></div>
          <div className="spec-note">Trim 70×110 mm · Artwork 76×116 mm · 3 mm bleed · 5 mm safe area · render ratio 19:29</div>
        </section>
      </div>
    </main>
  );
}
