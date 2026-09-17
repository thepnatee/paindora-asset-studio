"use client";

import { forwardRef } from "react";
import { CardRecord } from "@/lib/types";
import { ci, deckLabels } from "@/lib/design-system";

export const CardPreview = forwardRef<HTMLDivElement, { card: CardRecord }>(function CardPreview({ card }, ref) {
  const accent = ci.deck[card.deck];
  return (
    <div ref={ref} className="card" style={{ ["--accent" as string]: accent }}>
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
            <img src={card.illustrationDataUrl} alt="generated illustration" />
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
            <Info label="Impact" value={card.impact} />
          </div>
        )}
        {card.deck === "role" && (
          <div className="info-stack">
            <Info label="Capabilities" value={(card.capabilities ?? []).join(" • ")} />
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
            <span><b>Digital</b> {card.digitalConfidence}</span>
            <span>{(card.tags ?? []).join(" • ")}</span>
          </>
        )}
        {card.deck === "pain" && <><span>{card.difficulty}</span><span>Minimum {card.minimumAction}</span></>}
        {card.deck === "role" && <><span>{card.manday} MD</span><span>฿{card.budget ?? 0}</span></>}
        {card.deck === "action" && <><span>{card.manday} MD • ฿{card.budget ?? 0}</span><span>{card.roleRule}</span></>}
        {card.deck === "reality" && <><span>{card.penaltyManday} MD</span><span>฿{card.penaltyBudget ?? 0}</span></>}
      </div>
    </div>
  );
});

function Info({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="info-row">
      <div className="info-label">{label}</div>
      <div className="info-value">{value}</div>
    </div>
  );
}
