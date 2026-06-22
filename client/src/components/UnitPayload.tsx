// Renderers for each Unit kind. Kept compact for MVP.
import { useMemo } from 'react';
import type { UnitManifest } from '@/lib/taktak-data';
import { formatNum } from '@/lib/taktak-data';

export function UnitPayload({ unit }: { unit: UnitManifest }) {
  switch (unit.kind) {
    case 'content':     return <ContentBody unit={unit} />;
    case 'tool':        return <ToolBody unit={unit} />;
    case 'commerce':    return <CommerceBody unit={unit} />;
    case 'interactive': return <InteractiveBody unit={unit} />;
    case 'data':        return <DataBody unit={unit} />;
    case 'agent':       return <AgentBody unit={unit} />;
    case 'pass':        return <PassBody unit={unit} />;
  }
}

function ContentBody({ unit }: { unit: UnitManifest }) {
  const body = String(unit.payload.body ?? '');
  const mins = (unit.payload.readingMinutes as number | undefined) ?? 1;
  return (
    <div className="space-y-3" data-testid={`payload-content-${unit.id}`}>
      {(unit.payload.videoSeconds as number | undefined) && (
        <div className="rounded-xl bg-gradient-to-br from-cyan-500/20 to-amber-500/10 border border-card-border h-32 flex items-center justify-center text-3xl">▶</div>
      )}
      <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/85">{body || (unit.payload.transcript as string)}</p>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{mins} min read</div>
    </div>
  );
}

function ToolBody({ unit }: { unit: UnitManifest }) {
  if (unit.id === 'u2') {
    const { bids = [], asks = [], imbalance = 0 } = unit.payload as { bids: number[][]; asks: number[][]; imbalance: number };
    return (
      <div className="space-y-3" data-testid={`payload-tool-${unit.id}`}>
        <div className="grid grid-cols-2 gap-2 font-mono text-xs">
          <div className="space-y-1">
            {asks.slice().reverse().map(([p, s], i) => (
              <div key={i} className="flex justify-between rounded bg-rose-500/10 px-2 py-1">
                <span className="text-rose-400">{p}</span><span className="text-foreground/70">{s.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-1">
            {bids.map(([p, s], i) => (
              <div key={i} className="flex justify-between rounded bg-emerald-500/10 px-2 py-1">
                <span className="text-emerald-400">{p}</span><span className="text-foreground/70">{s.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">Imbalance: <span className="text-foreground font-mono">{(imbalance * 100).toFixed(0)}%</span> · live · MCP: <span className="font-mono text-primary">binance</span></div>
      </div>
    );
  }
  if (unit.id === 'u6') {
    return (
      <div className="space-y-2" data-testid={`payload-tool-${unit.id}`}>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg bg-muted/40 p-3"><div className="text-xs text-muted-foreground">Net €</div><div className="font-mono text-lg">100.00</div></div>
          <div className="rounded-lg bg-primary/10 border border-primary/30 p-3"><div className="text-xs text-muted-foreground">Gross €</div><div className="font-mono text-lg text-primary">119.00</div></div>
        </div>
        <div className="text-xs text-muted-foreground">Rate 19% · Cyprus 2026</div>
      </div>
    );
  }
  // u7 — markdown → carousel
  return (
    <div className="space-y-2" data-testid={`payload-tool-${unit.id}`}>
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {[1,2,3,4].map(n => (
          <div key={n} className="shrink-0 w-20 h-32 rounded-lg bg-gradient-to-br from-cyan-500/20 to-amber-500/10 border border-card-border flex items-center justify-center text-xs text-muted-foreground">slide {n}</div>
        ))}
      </div>
      <div className="text-xs text-muted-foreground font-mono">4 slides · 9:16 · ready</div>
    </div>
  );
}

function CommerceBody({ unit }: { unit: UnitManifest }) {
  // Brick-and-mortar branch (coffee shop, etc) — different payload shape
  if ((unit.payload as { kind?: string }).kind === 'brick-and-mortar') {
    const p = unit.payload as {
      address: string;
      coords: { lat: number; lng: number };
      hours: { day: string; open: string; close: string }[];
      isOpenNow: boolean;
      menu: { name: string; priceEur: number }[];
      loyalty: { stamps: number; neededForFree: number };
      photos: number;
      sellsBeans: boolean;
      acceptsCrypto: boolean;
    };
    return (
      <div className="space-y-3" data-testid={`payload-commerce-${unit.id}`}>
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: Math.min(p.photos, 6) }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg border border-card-border"
              style={{
                background: i % 2 === 0
                  ? 'linear-gradient(135deg, #8B5A2B 0%, #3E2723 100%)'
                  : 'linear-gradient(135deg, #D7CCC8 0%, #8D6E63 100%)',
              }}
            />
          ))}
        </div>
        <div className="flex items-start gap-2">
          <span className="text-base leading-none mt-0.5">📍</span>
          <div className="flex-1 text-sm leading-snug text-foreground/85">{p.address}</div>
          <span
            className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${
              p.isOpenNow
                ? 'bg-[#4CAF50]/15 text-[#2E7D32] border border-[#4CAF50]/30'
                : 'bg-rose-500/15 text-rose-600 border border-rose-500/30'
            }`}
            data-testid={`badge-open-${unit.id}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${p.isOpenNow ? 'bg-[#2E7D32]' : 'bg-rose-600'}`} />
            {p.isOpenNow ? 'открыто' : 'закрыто'}
          </span>
        </div>
        <div className="rounded-lg bg-muted/40 border border-card-border px-3 py-2 space-y-0.5">
          {p.hours.map(h => (
            <div key={h.day} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{h.day}</span>
              <span className="font-mono text-foreground/85">{h.open}–{h.close}</span>
            </div>
          ))}
        </div>
        <div className="space-y-1">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Меню</div>
          {p.menu.map(m => (
            <div key={m.name} className="flex items-center justify-between text-sm">
              <span className="text-foreground/85">{m.name}</span>
              <span className="font-mono text-foreground">€{m.priceEur.toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="rounded-lg bg-[#4CAF50]/10 border border-[#4CAF50]/25 px-3 py-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wider text-[#2E7D32] font-mono">Накопи на бесплатный</span>
            <span className="text-[11px] font-mono text-foreground/70">{p.loyalty.stamps}/{p.loyalty.neededForFree}</span>
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: p.loyalty.neededForFree }).map((_, i) => (
              <div
                key={i}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] ${
                  i < p.loyalty.stamps
                    ? 'bg-[#4CAF50] border-[#2E7D32] text-white'
                    : 'bg-transparent border-[#4CAF50]/30 text-transparent'
                }`}
              >
                ☕
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {p.acceptsCrypto && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/40 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-amber-700" data-testid={`badge-crypto-${unit.id}`}>
              ₿ принимаем крипто
            </span>
          )}
          {p.sellsBeans && (
            <span className="inline-flex items-center gap-1 rounded-full bg-stone-500/15 border border-stone-500/40 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-stone-700">
              зерно на вынос
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button className="flex-1 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover-elevate" data-testid="button-directions">
            Маршрут
          </button>
          <button className="rounded-full bg-card border border-card-border px-3 py-2 text-sm hover-elevate" data-testid="button-call">
            📞
          </button>
        </div>
      </div>
    );
  }

  const p = unit.payload as { priceUsd: number; edition: string; shipsFrom: string; images: number };
  return (
    <div className="space-y-3" data-testid={`payload-commerce-${unit.id}`}>
      <div className="grid grid-cols-4 gap-1">
        {Array.from({ length: p.images }).map((_, i) => (
          <div key={i} className="aspect-square rounded-lg bg-gradient-to-br from-amber-700/30 to-rose-700/20 border border-card-border" />
        ))}
      </div>
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-2xl font-display font-semibold">${p.priceUsd}</div>
          <div className="text-xs text-muted-foreground">{p.edition} · ships from {p.shipsFrom}</div>
        </div>
        <button className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover-elevate" data-testid="button-buy">Buy</button>
      </div>
    </div>
  );
}

function InteractiveBody({ unit }: { unit: UnitManifest }) {
  const opts = (unit.payload.options as Array<{ label: string; votes: number; hex: string }>) ?? [];
  const total = useMemo(() => opts.reduce((a, o) => a + o.votes, 0), [opts]);
  return (
    <div className="space-y-2" data-testid={`payload-interactive-${unit.id}`}>
      {opts.map(o => {
        const pct = (o.votes / total) * 100;
        return (
          <button key={o.label} className="w-full text-left rounded-lg border border-card-border bg-card/50 px-3 py-2 hover-elevate" data-testid={`vote-${o.label}`}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: o.hex }} />{o.label}</span>
              <span className="font-mono text-xs text-muted-foreground">{pct.toFixed(0)}% · {formatNum(o.votes)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full" style={{ width: `${pct}%`, background: o.hex, opacity: 0.7 }} />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function DataBody({ unit }: { unit: UnitManifest }) {
  const rows = (unit.payload.rows as Array<[string, number]>) ?? [];
  const sweeps = unit.payload.sweepCount as number;
  return (
    <div className="space-y-2" data-testid={`payload-data-${unit.id}`}>
      <div className="space-y-1">
        {rows.map(([label, v]) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-10 text-xs font-mono text-muted-foreground">{label}</div>
            <div className="flex-1 h-3 rounded bg-muted overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-500/70 to-amber-500/70" style={{ width: `${v * 100}%` }} />
            </div>
            <div className="w-10 text-right text-xs font-mono">{(v * 100).toFixed(0)}</div>
          </div>
        ))}
      </div>
      <div className="text-xs text-muted-foreground">Stop-sweeps (24h): <span className="font-mono text-foreground">{sweeps}</span></div>
    </div>
  );
}

// Patronage Pass — physical revenue-share cards rendered as tier thumbnails.
// Each tier is a tilted card with metallic gradient + engraved-style label.
function PassBody({ unit }: { unit: UnitManifest }) {
  const p = unit.payload as {
    tagline: string;
    tiers: { id: string; name: string; priceUsd: number; revBps: number; color: string; subtitle: string }[];
    backers: number;
    currency: string;
  };
  return (
    <div className="space-y-3" data-testid={`payload-pass-${unit.id}`}>
      <p className="text-sm leading-relaxed text-foreground/85 italic">“{p.tagline}”</p>
      <div className="grid grid-cols-3 gap-2">
        {p.tiers.map((t, idx) => (
          <button
            key={t.id}
            data-testid={`pass-tier-${t.id}`}
            className="group relative aspect-[3/4.6] rounded-lg overflow-hidden border border-card-border hover:border-foreground/40 transition-all"
            style={{
              background: `linear-gradient(135deg, ${t.color} 0%, ${shade(t.color, -28)} 50%, ${shade(t.color, -55)} 100%)`,
              transform: `rotate(${idx === 0 ? -2 : idx === 2 ? 2 : 0}deg)`,
            }}
          >
            {/* Embossed grid texture */}
            <div className="absolute inset-0 opacity-25 mix-blend-overlay" style={{
              backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.15) 0 1px, transparent 1px 14px), repeating-linear-gradient(90deg, rgba(0,0,0,0.15) 0 1px, transparent 1px 14px)',
            }} />
            {/* Chip */}
            <div className="absolute top-2 left-2 w-5 h-4 rounded-sm bg-yellow-300/70 border border-yellow-700/50 shadow-inner" />
            {/* Tier wordmark */}
            <div className="absolute top-2 right-2 text-[8px] font-mono font-bold tracking-widest text-black/65 uppercase">tier {idx+1}</div>
            {/* Foreground tier name */}
            <div className="absolute inset-x-1.5 bottom-7 text-center">
              <div className="text-[11px] font-display font-bold tracking-wider text-black/85 drop-shadow-sm uppercase">{t.name}</div>
              <div className="text-[8px] font-mono text-black/60 mt-0.5">{t.subtitle}</div>
            </div>
            {/* Price band */}
            <div className="absolute inset-x-0 bottom-0 bg-black/35 backdrop-blur-sm px-1.5 py-1 flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-white">${t.priceUsd}</span>
              <span className="text-[8px] font-mono text-white/80">{(t.revBps/100).toFixed(1)}% ⇺</span>
            </div>
          </button>
        ))}
      </div>
      <div className="flex items-baseline justify-between">
        <div className="text-xs text-muted-foreground">
          <span className="font-mono text-foreground">{p.backers}</span> backers · paid in {p.currency}
        </div>
        <div className="text-[10px] font-mono text-muted-foreground/80">⇺ = revenue share back to backer per Spin</div>
      </div>
    </div>
  );
}

// shade(hex, percent): darken (-) or lighten (+) a hex color. Pure helper, no deps.
function shade(hex: string, percent: number): string {
  const h = hex.replace('#','');
  const num = parseInt(h, 16);
  const t = percent < 0 ? 0 : 255;
  const f = Math.abs(percent) / 100;
  const r = (num >> 16) & 0xff, g = (num >> 8) & 0xff, b = num & 0xff;
  const R = Math.round((t - r) * f + r);
  const G = Math.round((t - g) * f + g);
  const B = Math.round((t - b) * f + b);
  return '#' + ((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1);
}

function AgentBody({ unit }: { unit: UnitManifest }) {
  const reply = unit.payload.lastReply as string;
  return (
    <div className="space-y-2" data-testid={`payload-agent-${unit.id}`}>
      <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">Last query · 14m ago</div>
      <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm leading-relaxed">{reply}</div>
      <div className="flex items-center gap-2">
        <input
          className="flex-1 rounded-lg bg-card border border-card-border px-3 py-2 text-sm"
          placeholder="Ask the agent…"
          data-testid={`input-agent-${unit.id}`}
        />
        <button className="rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-medium" data-testid={`button-ask-${unit.id}`}>Ask</button>
      </div>
      <div className="text-[11px] text-muted-foreground font-mono">model: {unit.llm}</div>
    </div>
  );
}
