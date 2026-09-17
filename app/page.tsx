"use client";

import { useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import cardsSeed from "@/data/cards.json";
import { CardRecord, DeckType } from "@/lib/types";
import { illustrationPrompt } from "@/lib/prompts";
import { CardPreview } from "@/components/CardPreview";

const deckOrder: DeckType[] = ["pain", "persona", "role", "action", "reality"];
const CLIENT_BATCH_SIZE = 6;

export default function Home() {
  const [cards, setCards] = useState<CardRecord[]>(cardsSeed as CardRecord[]);
  const [selectedId, setSelectedId] = useState(cards[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);

  const selected = cards.find(c => c.id === selectedId) ?? cards[0];
  const counts = useMemo(() => Object.fromEntries(deckOrder.map(d => [d, cards.filter(c => c.deck === d).length])), [cards]);

  function patch(patch: Partial<CardRecord>) {
    setCards(prev => prev.map(c => c.id === selected.id ? { ...c, ...patch } : c));
  }

  async function generateIllustration() {
    setBusy(true); setMessage("Generating illustration…");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: illustrationPrompt(selected) }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Generation failed");
      patch({ illustrationDataUrl: json.dataUrl });
      setMessage("Illustration generated.");
    } catch (e: any) {
      setMessage(e.message);
    } finally { setBusy(false); }
  }

  async function generateDeckIllustrations() {
    const deck = selected.deck;
    const deckCards = cards.filter(c => c.deck === deck);
    const pending = deckCards.filter(c => !c.illustrationDataUrl);

    if (!pending.length) {
      setMessage(`${deck.toUpperCase()} already has illustrations for every card.`);
      return;
    }

    const ok = window.confirm(
      `Generate ${pending.length} ${deck.toUpperCase()} illustrations?\n\n` +
      `Images are generated in batches of ${CLIENT_BATCH_SIZE}. API usage may incur cost.`,
    );
    if (!ok) return;

    setBusy(true);
    try {
      let completed = 0;
      for (let i = 0; i < pending.length; i += CLIENT_BATCH_SIZE) {
        const chunk = pending.slice(i, i + CLIENT_BATCH_SIZE);
        setMessage(`Generating ${deck.toUpperCase()} ${completed + 1}–${completed + chunk.length} of ${pending.length}…`);

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
          if (item.error) failures.push(`${item.id}: ${item.error}`);
        }

        setCards(prev => prev.map(card => {
          const dataUrl = resultMap.get(card.id);
          return dataUrl ? { ...card, illustrationDataUrl: dataUrl } : card;
        }));

        completed += chunk.length;
        if (failures.length) setMessage(`Generated ${completed}/${pending.length}. Failed: ${failures.join(" | ")}`);
      }
      setMessage(`Finished ${deck.toUpperCase()} batch generation.`);
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function exportPng() {
    if (!cardRef.current) return;
    const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${selected.id}.png`;
    a.click();
  }

  async function exportDeckZip() {
    setBusy(true); setMessage("Rendering deck ZIP…");
    try {
      const deckCards = cards.filter(c => c.deck === selected.deck);
      const zip = new JSZip();
      for (const card of deckCards) {
        setSelectedId(card.id);
        await new Promise(r => setTimeout(r, 120));
        if (!cardRef.current) continue;
        const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
        zip.file(`${card.id}.png`, dataUrl.split(",")[1], { base64: true });
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `paindora-${selected.deck}-deck.zip`;
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
      } catch (e: any) { setMessage(e.message); }
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
          <label>Illustration Prompt<textarea rows={8} value={illustrationPrompt(selected)} readOnly /></label>
          <div className="editor-actions">
            <button className="button" disabled={busy} onClick={generateIllustration}>{busy ? "Working…" : "Generate Illustration"}</button>
            <button className="button secondary" disabled={busy} onClick={generateDeckIllustrations}>Generate Current Deck</button>
          </div>
          <div className="cost-note">Lean-cost guard: batch size {CLIENT_BATCH_SIZE}. Existing illustrations are skipped.</div>
          <div className="message">{message}</div>
        </section>

        <section className="preview-panel">
          <div className="preview-head">
            <div className="section-title">Print Preview</div>
            <div className="preview-actions">
              <button className="button secondary" onClick={exportPng}>Export PNG</button>
              <button className="button secondary" disabled={busy} onClick={exportDeckZip}>Export Deck ZIP</button>
            </div>
          </div>
          <div className="preview-stage"><CardPreview ref={cardRef} card={selected} /></div>
          <div className="spec-note">Trim 70×110 mm · Artwork 76×116 mm · 3 mm bleed · 5 mm safe area · render ratio 19:29</div>
        </section>
      </div>
    </main>
  );
}
