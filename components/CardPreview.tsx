"use client";

import { forwardRef } from "react";
import { CardRecord, DisplayMode } from "@/lib/types";
import { ci, deckLabels } from "@/lib/design-system";
import { displayPoints } from "@/lib/readability";

export const CardPreview = forwardRef<HTMLDivElement, { card: CardRecord; displayMode?: DisplayMode }>(function CardPreview({ card, displayMode = "senior" }, ref) {
  const accent = ci.deck[card.deck];
  return (
    <div
      ref={ref}
      className={`card mode-${displayMode}`}
      style={{ ["--accent" as string]: accent }}
      data-display-mode={displayMode}
    >
      <div className="card-header">
        <div className="deck-pill">{deckLabels[card.deck]}</div>
        <div className="card-id">{card.id}</div>
      </div>

      <div className="card-body">
        <div className="title-block">
          <h2>{card.title}</h2>
          {(card.identity || card.subtitle) && <p>{card.identity ?? card.subtitle}</p>}
        </div>

        <div className="illustration-zone">
          {card.illustrationDataUrl ? (
            <img src={card.illustrationDataUrl} alt={`Illustration for ${card.title}`} />
          ) : (
            <div className="illustration-placeholder">ILLUSTRATION</div>
          )}
        </div>

        {card.deck === "persona" && (
          <div className="info-stack">
            <Info label="Goal" value={card.goal} />
            <Info label="Behavior" value={card.behavior} />
            <Info label="Constraint" value={card.constraint} />
          </div>
        )}
        {card.deck === "pain" && (
          <div className="info-stack">
            <Info label="Situation" value={card.situation} />
            <Info label="Impact" value={card.impact} points />
          </div>
        )}
        {card.deck === "role" && (
          <div className="info-stack">
            <Info label="Capabilities" value={(card.capabilities ?? []).join(" • ")} points />
            <Info label="Responsibilities" value={card.responsibilities} />
          </div>
        )}
        {card.deck === "action" && (
          <div className="info-stack">
            <Info label="Phase / Level" value={`${card.phase ?? ""} • ${card.level ?? ""}`} />
            <Info label="Action" value={card.description} />
          </div>
        )}
        {card.deck === "reality" && (
          <div className="info-stack">
            <Info label="Situation" value={card.situation} />
            <Info label="What changes now?" value={card.question} />
          </div>
        )}
      </div>

      <div className="card-footer">
        {card.deck === "persona" && (
          <>
            <span className="footer-chip"><b>Digital</b>&nbsp; {card.digitalConfidence}</span>
            <span className="footer-meta">{(card.tags ?? []).join(" • ")}</span>
          </>
        )}
        {card.deck === "pain" && (
          <>
            <span className="footer-chip">● {(card.difficulty ?? "").toUpperCase()}</span>
            <span className="footer-chip">⚡ ACTION {card.minimumAction}</span>
          </>
        )}
        {card.deck === "role" && (
          <><span className="footer-chip">{card.manday} MD</span><span className="footer-chip">฿{card.budget ?? 0}</span></>
        )}
        {card.deck === "action" && (
          <><span className="footer-chip">{card.manday} MD · ฿{card.budget ?? 0}</span><span className="footer-chip">{card.roleRule}</span></>
        )}
        {card.deck === "reality" && (
          <><span className="footer-chip">{card.penaltyManday} MD</span><span className="footer-chip">฿{card.penaltyBudget ?? 0}</span></>
        )}
      </div>
    </div>
  );
});

function Info({ label, value, points = false }: { label: string; value?: string; points?: boolean }) {
  if (!value) return null;
  const items = points ? displayPoints(value) : [];

  return (
    <div className="info-row">
      <div className="info-label">{label}</div>
      <div className="info-value">
        {points && items.length > 1 ? (
          <ul className="info-points">{items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>
        ) : value}
      </div>
    </div>
  );
}
