// Tak-Tak Post card — Hintology aesthetic: frosted-glass panel over nature photo.
// Content-first: front face shows content + license + fn-rail + links + stats.
// Tech details live on a flipped BACK face revealed by the (i) button.
//
// Visual contract:
//   • Card is a translucent white glass surface, floating over the meadow.
//   • Card stretches to fill ALL free space between TopBar and BottomDock.
//   • Right edge of card is flush — ActionRail floats on top, no reserved gutter.
//   • Top-right corner shows a colour-coded ORIGIN ribbon (handmade/respinned/freelanced).
//   • Beneath the title: a unified APP icon + author-written app-description line.
//   • Author avatar gains a GUILD flag badge when the author is available for hire.
import { useState } from 'react';
import { motion } from 'framer-motion';
import { UnitPayload } from './UnitPayload';
import type { UnitManifest, SpaceTemplate, AuthorOverlay } from '@/lib/taktak-data';
import { formatNum, licenseLabel, templatesById, spaces } from '@/lib/taktak-data';

function sanitizeOverlayVars(overlay: AuthorOverlay | undefined, whitelist: string[]): Record<string, string> {
  if (!overlay?.cssVars) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(overlay.cssVars)) {
    if (whitelist.includes(k)) out[k] = v;
  }
  return out;
}

interface Props {
  unit: UnitManifest;
  onAction: (action: 'respin' | 'give' | 'cherry' | 'react' | 'share', unit: UnitManifest) => void;
  onLinkClick?: (targetUnitId: string) => void;
}

// Origin colour map — diagonal ribbon in the corner uses these.
// Picked from event-chip palette in Hintology: green/amber/blue are distinct categorical hues.
const ORIGIN_STYLE = {
  handmade:   { color: '#2E7D32', ru: 'Сделано вручную',  icon: '✋', label: 'Handmade' },
  respinned:  { color: '#1E88E5', ru: 'Respinned',        icon: '↻', label: 'Respinned' },
  freelanced: { color: '#F9A825', ru: 'Через гильдию',    icon: '⚑', label: 'Freelanced' },
} as const;

export function UnitCard({ unit, onAction: _onAction, onLinkClick }: Props) {
  const [flipped, setFlipped] = useState(false);
  const space = spaces.find(s => s.id === unit.spaceId);
  const template: SpaceTemplate | undefined = space ? templatesById[space.templateId] : undefined;
  const shell = template?.shell;
  const overlayVars = shell ? sanitizeOverlayVars(unit.overlay, shell.cssVarsWhitelist) : {};
  // Only inject author CSS vars (palette/origin), not shell defaults — we keep Hintology surfaces.
  const styleVars: React.CSSProperties = overlayVars as React.CSSProperties;

  const origin = ORIGIN_STYLE[unit.origin];

  return (
    // Outer container fills the entire free area. No horizontal padding.
    <div className="h-full w-full flex items-stretch justify-center px-0">
      <motion.article
        key={flipped ? 'back' : 'front'}
        initial={{ opacity: 0, scale: 0.985 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="glass-strong relative w-full sm:max-w-md overflow-hidden flex flex-col h-full sm:rounded-[20px] shadow-2xl"
        style={styleVars}
        data-testid={`card-unit-${unit.id}`}
      >
        {/* ORIGIN corner ribbon — solid colored triangle on top-right.
            Color alone communicates origin (handmade/respinned/freelanced).
            Info icon sits over the triangle and opens the manifest (flip back). */}
        <div
          className="absolute top-0 right-0 w-16 h-16 pointer-events-none z-10"
          data-testid={`origin-marker-${unit.id}`}
          title={`Происхождение: ${origin.ru} · нажмите ⓘ для манифеста`}
        >
          <div
            className="absolute inset-0"
            style={{ background: origin.color, clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}
          />
        </div>
        {/* Info button over the triangle — opens manifest. */}
        {!flipped && (
          <button
            onClick={(e) => { e.stopPropagation(); setFlipped(true); }}
            data-testid={`flip-front-${unit.id}`}
            title={`Манифест · ${origin.ru}`}
            className="absolute top-14 right-3 z-20 w-7 h-7 rounded-full bg-white/85 hover:bg-white border border-black/10 flex items-center justify-center text-[#1A1A1A] transition-colors text-xs shadow-sm"
          >
            ⓘ
          </button>
        )}

        {!flipped && (
          <div className="absolute inset-0 flex flex-col">
            {/* Header: author + license — NO tech data.
                pt-16 keeps it clear of the floating TopBar capsule. */}
            <header className="flex items-start justify-between px-5 pt-16 pb-3 shrink-0 gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <AuthorAvatar unit={unit} />
                <div className="min-w-0">
                  <div className="text-sm font-semibold flex items-center gap-1.5 truncate text-foreground">
                    {unit.author.name}
                    {unit.author.verified && <span className="text-primary text-xs" title="verified">✓</span>}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5">
                    <span>@{unit.author.handle}</span>
                  </div>
                </div>
              </div>
              {/* Right-aligned chip cluster: for-hire next to license (patronage/free/paid).
                  Both chips live on the right side, balanced against the origin triangle in the corner. */}
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end max-w-[55%] pr-9">
                {unit.author.forHire && (
                  <span
                    className="px-1.5 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-wider whitespace-nowrap"
                    style={{ background: '#F9A82522', color: '#9C6A0E', border: '1px solid #F9A82555' }}
                    title={`Доступен для найма · гильдия ${unit.author.guild ?? ''}`}
                  >
                    for hire
                  </span>
                )}
                <LicensePill unit={unit} />
              </div>
            </header>

            {/* Title + app-icon strip (unified icon, per-post description text) */}
            <div className="px-5 pb-3 shrink-0">
              <h2 className="font-display text-xl leading-tight pr-2 text-foreground">{unit.title}</h2>
              {unit.subtitle && <p className="text-sm text-muted-foreground mt-1">{unit.subtitle}</p>}
              {unit.appDescription && (
                <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground" data-testid={`app-strip-${unit.id}`}>
                  <AppIcon />
                  <span className="truncate">{unit.appDescription}</span>
                </div>
              )}
            </div>

            {/* Content-first payload — scrolls if too tall */}
            <div className="px-5 pt-1 pb-3 flex-1 overflow-y-auto min-h-0" style={{ touchAction: 'pan-y' }}>
              <UnitPayload unit={unit} />
            </div>

            {/* Functionality rail — template-defined whitelist, author-picked subset */}
            {template?.shell?.fnRail && (
              <FnRail template={template} overlay={unit.overlay} unitId={unit.id} />
            )}

            {/* Hyperlink graph */}
            {unit.links && unit.links.length > 0 && (
              <UnitLinks links={unit.links} unitId={unit.id} onLinkClick={onLinkClick} />
            )}

            {/* Stats footer — pb-24 keeps the row above the floating BottomDock. */}
            <footer className="px-5 pt-3 pb-24 border-t border-black/5 bg-white/40 flex items-center justify-between text-xs text-muted-foreground shrink-0">
              <div className="flex items-center gap-4 font-mono">
                <span title="просмотры">👁 {formatNum(unit.stats.views)}</span>
                <span title="respins (форки)">↻ {formatNum(unit.stats.spins)}</span>
                <span title="cherries (заимствования)">🍒 {formatNum(unit.stats.cherries)}</span>
                <span title="patronage backers">♡ {formatNum(unit.stats.givers)}</span>
              </div>
            </footer>
          </div>
        )}

        {flipped && (
          <div className="absolute inset-0 flex flex-col bg-white">
            <header className="flex items-center justify-between px-5 pt-16 pb-3 border-b border-black/8 shrink-0 pr-16">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Manifest</div>
                <h3 className="font-display text-base mt-0.5 truncate">{unit.title}</h3>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setFlipped(false); }}
                data-testid={`flip-back-${unit.id}`}
                title="Вернуться к контенту"
                className="w-7 h-7 rounded-full bg-black/5 hover:bg-black/10 border border-black/5 flex items-center justify-center text-foreground transition-colors text-xs"
              >
                ✕
              </button>
            </header>

            <div className="px-5 py-4 pb-24 flex-1 overflow-y-auto space-y-3 min-h-0 text-xs" style={{ touchAction: 'pan-y' }}>
              <Row label="Origin">
                <span className="font-mono px-2 py-0.5 rounded-full"
                  style={{ background: `${origin.color}1A`, color: origin.color, border: `1px solid ${origin.color}55` }}>
                  {origin.icon} {origin.ru}
                </span>
              </Row>

              <Row label="Author">
                <span className="font-mono">@{unit.author.handle}</span>
                <span className="text-muted-foreground ml-2">rep <span className="text-foreground">{unit.author.reputation}</span> {unit.author.verified && '· ✓ verified'}</span>
                {unit.author.forHire && unit.author.guild && (
                  <span className="text-muted-foreground ml-2">· гильдия <span className="text-foreground font-mono">{unit.author.guild}</span></span>
                )}
              </Row>

              {template && (
                <Row label="Template">
                  <span className="font-mono text-primary">{template.handle}</span>
                  <span className="text-muted-foreground ml-2">@{space?.templatePin}</span>
                  {space && space.templateUpdatesAvailable > 0 && (
                    <span className="ml-2 inline-block px-1.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">+{space.templateUpdatesAvailable} upstream</span>
                  )}
                </Row>
              )}

              <Row label="Git">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono border ${
                  unit.branch !== 'main'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-sky-50 text-sky-700 border-sky-200'
                }`}>⛖ {unit.branch}</span>
                <span className="ml-2 font-mono text-muted-foreground" title={`commit on Base L2 + IPFS · generation ${unit.generation}`}>@{unit.commitHash}</span>
                <span className="ml-3 text-muted-foreground font-mono">⧉ {unit.forks} forks</span>
                <span className={`ml-2 font-mono ${unit.openPRs > 0 ? 'text-amber-700' : 'text-muted-foreground'}`}>↗ {unit.openPRs} PR</span>
              </Row>

              <Row label="Runtime">
                <div className="flex flex-wrap gap-1.5">
                  {unit.env.map(e => (
                    <span key={e} className="font-mono rounded-full px-2 py-0.5 border bg-sky-50 text-sky-700 border-sky-200">{e}</span>
                  ))}
                  {unit.env.length === 0 && <span className="text-muted-foreground">—</span>}
                </div>
              </Row>

              {unit.mcp.length > 0 && (
                <Row label="MCP">
                  <div className="flex flex-wrap gap-1.5">
                    {unit.mcp.map(m => (
                      <span key={m} className="font-mono rounded-full px-2 py-0.5 border bg-amber-50 text-amber-800 border-amber-200">{m.replace('mcp://','')}</span>
                    ))}
                  </div>
                </Row>
              )}

              {(unit.llm || unit.routePolicy) && (
                <Row label="LLM">
                  {unit.llm && <span className="font-mono rounded-full px-2 py-0.5 border bg-purple-50 text-purple-700 border-purple-200">{unit.llm}</span>}
                  {unit.routePolicy && <RouteBadge policy={unit.routePolicy} />}
                </Row>
              )}

              <Row label="License">
                <span className="font-mono">{licenseLabel(unit.license.kind)}</span>
                {unit.license.spinPrice ? <span className="text-muted-foreground ml-2">Respin: <span className="text-foreground">${unit.license.spinPrice.toFixed(2)}</span></span> : <span className="text-muted-foreground ml-2">Respin: <span className="text-emerald-700">free</span></span>}
                {unit.license.revenueShareBps != null && <span className="text-muted-foreground ml-2">revshare: <span className="text-foreground">{(unit.license.revenueShareBps/100).toFixed(0)}%</span></span>}
              </Row>

              <Row label="Registry">
                <span className="font-mono text-muted-foreground" title="Base L2 registry hash">{unit.registryHash}</span>
              </Row>

              {unit.promptTemplate && (
                <Row label="Prompt">
                  <pre className="font-mono text-[10px] whitespace-pre-wrap text-muted-foreground bg-black/5 rounded-lg p-2 border border-black/5">{unit.promptTemplate}</pre>
                </Row>
              )}
            </div>

            <footer className="px-5 py-3 border-t border-black/8 bg-black/[0.02] text-[10px] font-mono text-muted-foreground/70 shrink-0">
              Manifest defined by template <span className="text-primary">{template?.handle}</span> · sandboxed by engine
            </footer>
          </div>
        )}
      </motion.article>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-16 shrink-0 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 pt-0.5">{label}</div>
      <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-1 gap-y-1">{children}</div>
    </div>
  );
}

// Unified app icon — the SAME symbol for every post. Only the description text varies.
function AppIcon() {
  return (
    <span
      className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-white/80 border border-black/5 text-foreground shrink-0"
      title="Встроенное приложение поста"
      aria-label="app"
    >
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.2">
        <rect x="1" y="1" width="3.5" height="3.5" rx="0.5" />
        <rect x="6.5" y="1" width="3.5" height="3.5" rx="0.5" />
        <rect x="1" y="6.5" width="3.5" height="3.5" rx="0.5" />
        <rect x="6.5" y="6.5" width="3.5" height="3.5" rx="0.5" />
      </svg>
    </span>
  );
}

// Author avatar with optional guild badge (visible when forHire).
function AuthorAvatar({ unit }: { unit: UnitManifest }) {
  const a = unit.author;
  return (
    <div className="relative shrink-0">
      <div
        className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-amber-100 flex items-center justify-center text-xl ring-1 ring-black/5"
        data-testid={`avatar-${a.id}`}
      >
        {a.avatar}
      </div>
      {a.forHire && (
        <span
          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold"
          style={{ background: '#F9A825', color: 'white' }}
          title={`Гильдия: ${a.guild ?? ''} · принимает заказы`}
          data-testid={`guild-badge-${a.id}`}
        >
          ⚑
        </span>
      )}
    </div>
  );
}

function LicensePill({ unit }: { unit: UnitManifest }) {
  const colors: Record<string, string> = {
    free:          'bg-emerald-50 text-emerald-800 border-emerald-200',
    'micro-paid':  'bg-amber-50 text-amber-800 border-amber-200',
    patronage:     'bg-rose-50 text-rose-800 border-rose-200',
    proprietary:   'bg-black/5 text-muted-foreground border-black/10',
  };
  const price = unit.license.spinPrice ? ` · $${unit.license.spinPrice.toFixed(2)}` : '';
  const rev = unit.license.revenueShareBps ? ` · ${(unit.license.revenueShareBps / 100).toFixed(0)}%↺` : '';
  const title = `${licenseLabel(unit.license.kind)}${price}${rev}`;
  return (
    <div
      className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider whitespace-nowrap ${colors[unit.license.kind]}`}
      title="License + revenue share back to original author"
      data-testid={`license-${unit.id}`}
    >
      {title}
    </div>
  );
}

// Functionality rail — template-defined "do-actions". 'share' excluded (lives on ActionRail).
function FnRail({
  template,
  overlay,
  unitId,
}: {
  template: SpaceTemplate;
  overlay: AuthorOverlay | undefined;
  unitId: string;
}) {
  const rail = template.shell.fnRail;
  const whitelistMap = new Map(rail.whitelist.map(b => [b.id, b]));
  const pickedIdsRaw = overlay?.fnButtons?.length
    ? overlay.fnButtons.slice(0, rail.maxAuthorPicks)
    : rail.defaultSelection.slice(0, rail.maxAuthorPicks).map(id => ({ id }));
  const pickedIds = pickedIdsRaw.filter(p => p.id !== 'share');
  const items = pickedIds
    .map(sel => {
      const wb = whitelistMap.get(sel.id);
      if (!wb) return null;
      const label = sel.labelOverride && sel.labelOverride.length <= 24 ? sel.labelOverride : wb.defaultLabel;
      return { ...wb, label };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (items.length === 0) return null;

  const categoryStyle: Record<string, string> = {
    primary:   'pill-primary',
    secondary: 'pill-dark',
    utility:   'pill-light',
  };

  return (
    <div
      className="px-5 pb-2 flex flex-wrap items-center gap-1.5 border-t border-black/5 pt-2.5 shrink-0"
      data-testid={`fn-rail-${unitId}`}
      title={`Functionality layer · ${items.length}/${rail.maxAuthorPicks} pinned`}
    >
      {items.map((b) => (
        <button
          key={b.id}
          className={`pill ${categoryStyle[b.category]} text-[12px]`}
          title={`Action: ${b.action} · category: ${b.category}`}
          data-testid={`fn-${unitId}-${b.id}`}
          onClick={(e) => { e.stopPropagation(); }}
        >
          {b.icon && <span className="opacity-90">{b.icon}</span>}
          <span>{b.label}</span>
        </button>
      ))}
    </div>
  );
}

function UnitLinks({
  links,
  unitId,
  onLinkClick,
}: {
  links: NonNullable<UnitManifest['links']>;
  unitId: string;
  onLinkClick?: (id: string) => void;
}) {
  const kindIcon: Record<string, string> = {
    reference: '→',
    parent: '↰',
    'remix-of': '↻',
    dependency: '⇢',
  };
  return (
    <div className="px-5 pb-3 flex flex-wrap gap-1.5 shrink-0" data-testid={`links-${unitId}`}>
      {links.map((l, i) => (
        <button
          key={i}
          onClick={() => onLinkClick?.(l.targetUnitId)}
          className="text-[10px] font-mono rounded-full px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors"
          title={`Ссылка · тип: ${l.kind} · цель: ${l.targetUnitId}`}
          data-testid={`link-${unitId}-${l.targetUnitId}`}
        >
          <span className="opacity-60">{kindIcon[l.kind]}</span> {l.label}
        </button>
      ))}
    </div>
  );
}

function RouteBadge({ policy }: { policy: 'hot' | 'cold' | 'hybrid' }) {
  const map = {
    hot:    { c: 'bg-rose-50 text-rose-800 border-rose-200',     icon: '▲', label: 'hot',    title: 'Hot path — managed low-latency LLM. Interactive UX with strict P99 budget.' },
    cold:   { c: 'bg-sky-50 text-sky-700 border-sky-200',         icon: '▽', label: 'cold',   title: 'Cold path — community node (Bittensor / Akash). Batch generation, training, regen.' },
    hybrid: { c: 'bg-purple-50 text-purple-700 border-purple-200', icon: '◈', label: 'hybrid', title: 'Hybrid — first token from hot provider, rest streamed from community node.' },
  }[policy];
  return (
    <span
      className={`font-mono rounded-full px-2 py-0.5 border ${map.c}`}
      title={map.title}
      data-testid={`chip-route-${policy}`}
    >
      {map.icon} route:{map.label}
    </span>
  );
}
