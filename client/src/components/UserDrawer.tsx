// UserDrawer — slide-down sheet from the TopBar avatar pill.
// Holds the menu (Profile, Earnings, My posts, Subscriptions, Settings).
// When `view === 'earnings'`, renders the realtime Earnings dashboard inline.

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { units as allUnits, spaces, formatNum, PITCH_RU, PLATFORM_PRINCIPLES, DOMAINS, REVENUE_PASS_TIERS, type UnitManifest } from '@/lib/taktak-data';

export type UserView = 'menu' | 'earnings' | 'profile' | 'posts' | 'subs' | 'settings' | 'about' | 'pass';

interface CurrentUser {
  id: string;
  handle: string;
  name: string;
  avatar: string;
  reputation: number;
}

// Demo current user — in production this comes from auth.
// For coherence with the rest of the demo dataset we pretend the viewer is Nadia.
export const currentUser: CurrentUser = {
  id: 'a1',
  handle: 'nadia.tt',
  name: 'Nadia K. (you)',
  avatar: '🌙',
  reputation: 87,
};

export function UserDrawer({ onClose, initialView = 'menu' }: { onClose: () => void; initialView?: UserView }) {
  const [view, setView] = useState<UserView>(initialView);

  // ESC closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-stretch justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        data-testid="drawer-user"
        data-no-swipe
      >
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <motion.div
          className="relative w-full sm:max-w-md drawer-surface overflow-y-auto"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 backdrop-blur-md bg-white/85 border-b border-black/5 px-4 py-3 flex items-center gap-3">
            {view !== 'menu' && (
              <button
                onClick={() => setView('menu')}
                className="rounded-full w-8 h-8 flex items-center justify-center bg-black/5 hover:bg-black/10 text-[#1A1A1A]"
                data-testid="user-drawer-back"
                aria-label="Back"
              >
                ←
              </button>
            )}
            <div className="flex items-center gap-2 flex-1">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400/40 to-amber-400/40 border border-black/10 flex items-center justify-center text-base">
                {currentUser.avatar}
              </div>
              <div className="leading-tight">
                <div className="text-sm font-medium text-[#1A1A1A]">{currentUser.name}</div>
                <div className="text-[11px] font-mono text-[#6B7785]">@{currentUser.handle} · rep {currentUser.reputation}</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full w-8 h-8 flex items-center justify-center bg-black/5 hover:bg-black/10 text-[#1A1A1A]"
              data-testid="user-drawer-close"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="px-4 py-4">
            {view === 'menu' && <UserMenu onPick={setView} />}
            {view === 'earnings' && <EarningsView />}
            {view === 'about' && <AboutView />}
            {view === 'pass' && <PassView />}
            {view === 'profile' && <PlaceholderView title="Профиль" body="Здесь будет публичный профиль, гильдия, репутация, верификации." />}
            {view === 'posts' && <PlaceholderView title="Мои посты" body="Список ваших юнитов, статистика просмотров, версий, форков." />}
            {view === 'subs' && <PlaceholderView title="Подписки" body="Спейсы, на которые вы подписаны. Управление лентой For You." />}
            {view === 'settings' && <PlaceholderView title="Настройки" body="Кошелёк, ключи, экспорт данных, удалить аккаунт." />}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function UserMenu({ onPick }: { onPick: (v: UserView) => void }) {
  // Live totals — derived from units owned by current user, plus all units that
  // cite a unit owned by current user via parentId / parentHashes (attribution
  // revenue from respins and cherries).
  const totals = useMemo(() => computeEarnings(currentUser.id), []);

  const items: { id: UserView; icon: string; label: string; meta?: string; accent?: boolean }[] = [
    { id: 'earnings', icon: '◉', label: 'Earnings', meta: `$${totals.todayUsd.toFixed(2)} сегодня · $${totals.totalUsd.toFixed(2)} всего`, accent: true },
    { id: 'pass',     icon: '◆', label: 'Revenue Pass', meta: '4 тира · от бесплатного до collectible' },
    { id: 'posts',    icon: '⊞', label: 'Мои посты', meta: `${totals.myPosts} юнитов · ${formatNum(totals.totalViews)} просмотров` },
    { id: 'subs',     icon: '✦', label: 'Подписки', meta: `${spaces.length - 1} каналов` },
    { id: 'profile',  icon: '◯', label: 'Профиль', meta: `@${currentUser.handle}` },
    { id: 'about',    icon: '✰', label: 'О Tak-Tak', meta: 'Питч, принципы, домены' },
    { id: 'settings', icon: '⚙', label: 'Настройки', meta: 'Кошелёк, ключи, экспорт' },
  ];

  return (
    <div className="space-y-1.5">
      {items.map(it => (
        <button
          key={it.id}
          onClick={() => onPick(it.id)}
          data-testid={`user-menu-${it.id}`}
          className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
            it.accent
              ? 'bg-[#4CAF50]/10 border border-[#4CAF50]/30 hover:bg-[#4CAF50]/15'
              : 'bg-black/[0.03] border border-black/5 hover:bg-black/[0.06]'
          }`}
        >
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base ${it.accent ? 'bg-[#4CAF50]/20 text-[#2E7D32]' : 'bg-white/70 text-[#1A1A1A]'}`}>
            {it.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-medium ${it.accent ? 'text-[#2E7D32]' : 'text-[#1A1A1A]'}`}>{it.label}</div>
            {it.meta && <div className="text-[11px] font-mono text-[#6B7785] truncate">{it.meta}</div>}
          </div>
          <span className="text-[#6B7785]">›</span>
        </button>
      ))}

      <div className="pt-3 mt-2 border-t border-black/5 text-[10px] font-mono text-[#6B7785] uppercase tracking-wider">
        web 4.0 · Tak-Tak v0.7.2
      </div>
    </div>
  );
}

function PlaceholderView({ title, body }: { title: string; body: string }) {
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-display font-semibold text-[#1A1A1A]">{title}</h2>
      <p className="text-sm text-[#6B7785] leading-relaxed">{body}</p>
      <div className="rounded-lg bg-black/[0.03] border border-black/5 px-3 py-3 text-xs font-mono text-[#6B7785]">
        MVP: раздел заглушён.
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Earnings view — realtime revenue dashboard
// ──────────────────────────────────────────────────────────────────────────────

interface PerCardEarning {
  unit: UnitManifest;
  // gross income from this card (direct revenue + attribution from descendants)
  grossUsd: number;
  // direct = own license/sale, attribution = revenue share from respins / cherries
  directUsd: number;
  attributionUsd: number;
  // cost to host & serve (LLM compute, mcp, infra) — affects profitability
  costUsd: number;
  // net = gross - cost
  netUsd: number;
  margin: number;                  // 0..1
  liveNow: boolean;                // last tick within the synthetic "now" window
  rateUsdPerHour: number;          // instant burn rate
  // attribution breakdown
  respinIncomeUsd: number;         // revShare from forks (Spins)
  cherryIncomeUsd: number;         // revShare from cherry-picks
  givenByPatrons: number;          // patronage backers count
}

// Synthetic, deterministic earnings model derived from existing unit stats.
// In production: streamed from on-chain ledger / payment processor webhooks.
function computeEarnings(authorId: string) {
  // Find owned units
  const myUnits = allUnits.filter(u => u.author.id === authorId);

  // Build a quick index for attribution traversal:
  // For each of my units, find downstream units (forks/respins) that route
  // a revenueShare back. Demo dataset uses links/parentId; for MVP we model
  // attribution from `spins * spinPrice * revShareBps`.
  const cards: PerCardEarning[] = myUnits.map(unit => {
    const lic = unit.license;
    const spinPrice = lic.spinPrice ?? 0;
    const revShareBps = lic.revenueShareBps ?? 0;

    // Direct revenue: micro-paid spins × spinPrice (the author keeps 1 - revShareBps
    // when someone spins THEIR own card vs upstream — for own card, full price).
    let directUsd = 0;
    if (lic.kind === 'micro-paid') {
      directUsd = unit.stats.spins * spinPrice * 0.85; // 15% platform/upstream cut
    } else if (lic.kind === 'patronage') {
      // patronage = monthly recurring per backer (synthetic avg $4.80/mo)
      directUsd = unit.stats.givers * 4.80;
    } else if (lic.kind === 'proprietary') {
      // Slow Market style — assume avg sale value × cherries-as-checkouts proxy
      const avgSale = (unit.payload as { priceUsd?: number }).priceUsd ?? 50;
      directUsd = (unit.stats.cherries / 50) * avgSale; // ~2% conversion proxy
    } else {
      // free — no direct revenue, only tips via Give
      directUsd = unit.stats.givers * 1.20;
    }

    // Attribution revenue: each of MY units that has been respinned/forked by
    // others — I get revShareBps of the downstream's gross. Approximation:
    // forks count × avg respin gross × revShare.
    const avgRespinGross = 1.40;
    const respinIncomeUsd = (unit.forks ?? 0) * avgRespinGross * (revShareBps / 10000);

    // Cherry attribution: cherry uses a fragment of my card in someone else's
    // unit and pays auto-attribution. Demo factor: 0.5% per cherry.
    const cherryIncomeUsd = unit.stats.cherries * 0.018;

    const attributionUsd = respinIncomeUsd + cherryIncomeUsd;
    const grossUsd = directUsd + attributionUsd;

    // Cost model: LLM compute proxy from llm field, MCP calls proxy from mcp.length,
    // infra fixed per view.
    const llmCost = (unit.llm ? 0.0012 : 0) * unit.stats.views;
    const mcpCost = unit.mcp.length * 0.0004 * unit.stats.views;
    const infraCost = 0.00007 * unit.stats.views;
    const costUsd = llmCost + mcpCost + infraCost;

    const netUsd = grossUsd - costUsd;
    const margin = grossUsd > 0 ? netUsd / grossUsd : 0;

    // Instant rate: pretend last hour of spins (~ spins/720 hours since posted)
    // give the per-hour burn rate.
    const hoursSincePost = Math.max(1, (Date.now() - new Date(unit.createdAt).getTime()) / 3_600_000);
    const rateUsdPerHour = grossUsd / hoursSincePost;

    // Live now if posted in last 96 hours and spins > 0
    const liveNow = hoursSincePost < 96 && unit.stats.spins > 0;

    return {
      unit, grossUsd, directUsd, attributionUsd, costUsd, netUsd, margin,
      liveNow, rateUsdPerHour,
      respinIncomeUsd, cherryIncomeUsd,
      givenByPatrons: unit.stats.givers,
    };
  });

  const totalUsd = cards.reduce((a, c) => a + c.netUsd, 0);
  const grossUsd = cards.reduce((a, c) => a + c.grossUsd, 0);
  const directUsd = cards.reduce((a, c) => a + c.directUsd, 0);
  const attributionUsd = cards.reduce((a, c) => a + c.attributionUsd, 0);
  const respinUsd = cards.reduce((a, c) => a + c.respinIncomeUsd, 0);
  const cherryUsd = cards.reduce((a, c) => a + c.cherryIncomeUsd, 0);
  const costUsd = cards.reduce((a, c) => a + c.costUsd, 0);
  const totalViews = cards.reduce((a, c) => a + c.unit.stats.views, 0);

  // Today proxy: 4% of grand total
  const todayUsd = totalUsd * 0.04;

  // Sort cards by net descending
  cards.sort((a, b) => b.netUsd - a.netUsd);

  return {
    cards,
    totalUsd, grossUsd, directUsd, attributionUsd, respinUsd, cherryUsd, costUsd,
    totalViews,
    todayUsd,
    myPosts: myUnits.length,
  };
}

function EarningsView() {
  const data = useMemo(() => computeEarnings(currentUser.id), []);
  const [tick, setTick] = useState(0);

  // Live ticking: emulate streaming updates so the screen feels alive.
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 1500);
    return () => clearInterval(t);
  }, []);

  // Synthetic live delta = aggregate rate × elapsed seconds
  const liveRatePerSec = data.cards.reduce((a, c) => a + c.rateUsdPerHour, 0) / 3600;
  const liveDelta = liveRatePerSec * tick * 1.5;

  return (
    <div className="space-y-4" data-testid="view-earnings">
      <div>
        <div className="text-[10px] uppercase tracking-wider text-[#6B7785] font-mono">Realtime earnings</div>
        <div className="flex items-baseline gap-3 mt-0.5">
          <div className="text-3xl font-display font-bold text-[#1A1A1A] tabular-nums">
            ${(data.totalUsd + liveDelta).toFixed(2)}
          </div>
          <div className="text-xs font-mono text-[#2E7D32] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32] animate-pulse" />
            +${(liveRatePerSec * 60).toFixed(3)}/min
          </div>
        </div>
        <div className="text-[11px] font-mono text-[#6B7785] mt-1">
          ${data.todayUsd.toFixed(2)} сегодня · {data.cards.filter(c => c.liveNow).length} карточек live
        </div>
      </div>

      {/* Sparkline-style breakdown */}
      <div className="grid grid-cols-2 gap-2">
        <Tile label="Прямой доход"     value={`$${data.directUsd.toFixed(2)}`} sub="продажи + патронаж" testid="tile-direct" />
        <Tile label="Атрибуция"          value={`$${data.attributionUsd.toFixed(2)}`} sub={`respin + cherry`} testid="tile-attribution" accent />
        <Tile label="От респинов"       value={`$${data.respinUsd.toFixed(2)}`} sub={`${data.cards.reduce((a, c) => a + c.unit.forks, 0)} форков`} testid="tile-respin" />
        <Tile label="От cherry-цитат" value={`$${data.cherryUsd.toFixed(2)}`} sub={`${data.cards.reduce((a, c) => a + c.unit.stats.cherries, 0)} 🍒`} testid="tile-cherry" />
        <Tile label="Расход (compute)" value={`-$${data.costUsd.toFixed(2)}`} sub="LLM + MCP + infra" testid="tile-cost" negative />
        <Tile label="Маржа"             value={`${((data.totalUsd / data.grossUsd) * 100).toFixed(0)}%`} sub={`gross $${data.grossUsd.toFixed(2)}`} testid="tile-margin" />
      </div>

      {/* Per-card profitability */}
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <h3 className="text-sm font-display font-semibold text-[#1A1A1A]">Прибыльность по карточкам</h3>
          <span className="text-[10px] font-mono text-[#6B7785] uppercase">sorted by net</span>
        </div>
        <div className="space-y-2">
          {data.cards.map(c => (
            <CardRow key={c.unit.id} c={c} />
          ))}
        </div>
      </div>

      {/* Footer note */}
      <div className="pt-2 border-t border-black/5 text-[10px] font-mono text-[#6B7785] leading-relaxed">
        Доход начисляется в реальном времени: прямые продажи + revenueShareBps от каждого даунстрим Spin / Cherry / Patronage. Расчёты on-chain через engine/registry/base@1.0.0.
      </div>
    </div>
  );
}

function Tile({ label, value, sub, testid, accent, negative }: { label: string; value: string; sub?: string; testid: string; accent?: boolean; negative?: boolean }) {
  return (
    <div
      data-testid={testid}
      className={`rounded-xl px-3 py-2.5 border ${
        accent ? 'bg-[#4CAF50]/10 border-[#4CAF50]/30'
        : negative ? 'bg-rose-500/8 border-rose-500/25'
        : 'bg-black/[0.03] border-black/5'
      }`}
    >
      <div className="text-[9px] uppercase tracking-wider text-[#6B7785] font-mono">{label}</div>
      <div className={`text-lg font-display font-semibold tabular-nums ${negative ? 'text-rose-700' : 'text-[#1A1A1A]'}`}>{value}</div>
      {sub && <div className="text-[10px] font-mono text-[#6B7785] truncate">{sub}</div>}
    </div>
  );
}

function CardRow({ c }: { c: PerCardEarning }) {
  const u = c.unit;
  const space = spaces.find(s => s.id === u.spaceId);
  return (
    <div
      className="rounded-xl border border-black/5 bg-white/60 px-3 py-2.5"
      data-testid={`earnings-card-${u.id}`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-base leading-none">{space?.icon ?? '✦'}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-[#1A1A1A] truncate">{u.title}</div>
          <div className="text-[10px] font-mono text-[#6B7785]">{space?.name ?? u.spaceId} · {u.license.kind}</div>
        </div>
        <div className="text-right">
          <div className={`text-sm font-display font-semibold tabular-nums ${c.netUsd >= 0 ? 'text-[#2E7D32]' : 'text-rose-700'}`}>
            ${c.netUsd.toFixed(2)}
          </div>
          <div className="text-[9px] font-mono text-[#6B7785]">
            {(c.margin * 100).toFixed(0)}% margin
          </div>
        </div>
      </div>

      {/* Profitability bar: direct vs attribution vs cost */}
      <div className="space-y-1">
        <div className="flex h-1.5 rounded-full overflow-hidden bg-black/5">
          <div className="bg-[#4CAF50]" style={{ width: `${(c.directUsd / Math.max(c.grossUsd, 0.01)) * 100}%` }} />
          <div className="bg-[#FFB74D]" style={{ width: `${(c.attributionUsd / Math.max(c.grossUsd, 0.01)) * 100}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-[#6B7785]">
          <span>
            <span className="inline-block w-2 h-2 rounded-full bg-[#4CAF50] align-middle mr-1" />
            ${c.directUsd.toFixed(2)} прямой
          </span>
          <span>
            <span className="inline-block w-2 h-2 rounded-full bg-[#FFB74D] align-middle mr-1" />
            ${c.attributionUsd.toFixed(2)} attr
          </span>
          <span className="text-right">−${c.costUsd.toFixed(2)} cost</span>
        </div>
      </div>

      {/* Attribution detail (respin + cherry) */}
      {c.attributionUsd > 0.001 && (
        <div className="mt-1.5 flex flex-wrap gap-1 text-[10px] font-mono">
          {c.respinIncomeUsd > 0.001 && (
            <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-700 px-1.5 py-0.5">
              ↻ {u.forks} respin → ${c.respinIncomeUsd.toFixed(2)}
            </span>
          )}
          {c.cherryIncomeUsd > 0.001 && (
            <span className="rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-700 px-1.5 py-0.5">
              🍒 {u.stats.cherries} → ${c.cherryIncomeUsd.toFixed(2)}
            </span>
          )}
          {c.unit.license.kind === 'patronage' && (
            <span className="rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-700 px-1.5 py-0.5">
              ◆ {c.givenByPatrons} patrons
            </span>
          )}
        </div>
      )}

      {c.liveNow && (
        <div className="mt-1.5 flex items-center gap-1 text-[10px] font-mono text-[#2E7D32]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32] animate-pulse" />
          live · ${c.rateUsdPerHour.toFixed(3)}/hour
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// About view — canonical pitch + 3 differentiators + platform principles + cross-domain.
// Single source of truth — strings live in @/lib/taktak-data.
// ──────────────────────────────────────────────────────────────────────────────

// Visual card mock — ISO/IEC 7810 ID-1 ratio (85.6 × 53.98 mm → ~1.586:1).
// Surface, foil treatment and chip cluster differ by `designer`.
function PassCardMock({ tier, serial }: { tier: typeof REVENUE_PASS_TIERS[number]; serial: string }) {
  const isSystem = tier.designer === 'system';
  const isFreelancer = tier.designer === 'freelancer';
  const isBrand = tier.designer === 'brand-owner';

  // Surface — system: matte off-white with thin accent; freelancer: foil-gradient on PVC;
  // brand-owner: brushed-metal laminate.
  const surface = isSystem
    ? { background: `linear-gradient(135deg, #F4F2EC 0%, #ECE9E1 100%)` }
    : isFreelancer
    ? {
        background: `linear-gradient(135deg, ${tier.accent} 0%, ${tier.accent}CC 38%, #2A1F12 100%)`,
      }
    : {
        background: `linear-gradient(135deg, #1A2330 0%, #243042 45%, ${tier.accent} 100%)`,
      };

  // Text + chip contrast — light on dark surfaces, dark on light.
  const onDark = !isSystem;
  const ink = onDark ? '#F6F4EE' : '#1A1A1A';
  const inkSoft = onDark ? '#F6F4EEAA' : '#1A1A1A88';

  return (
    <div
      data-testid={`pass-card-mock-${tier.id}`}
      className="relative w-full overflow-hidden rounded-2xl shadow-lg"
      style={{
        aspectRatio: '1.586 / 1',
        ...surface,
        boxShadow: onDark
          ? `0 10px 24px -12px ${tier.accent}55, 0 2px 6px rgba(0,0,0,0.18)`
          : `0 8px 20px -14px rgba(0,0,0,0.45)`,
      }}
    >
      {/* Hot-stamp foil sweep for freelancer / brushed sheen for brand */}
      {isFreelancer && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.28) 50%, transparent 70%)',
            mixBlendMode: 'overlay',
          }}
        />
      )}
      {isBrand && (
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            background:
              'repeating-linear-gradient(115deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 3px)',
          }}
        />
      )}

      {/* Top row — issuer + tier number */}
      <div className="absolute top-3 left-4 right-4 flex items-start justify-between">
        <div className="font-mono text-[9px] uppercase tracking-[0.18em]" style={{ color: inkSoft }}>
          tak-tak · revenue pass
        </div>
        <div className="font-mono text-[9px] tracking-[0.12em]" style={{ color: inkSoft }}>
          tier {String(tier.level).padStart(2, '0')}
        </div>
      </div>

      {/* EMV chip + NFC wave cluster (skip on free t0) */}
      {tier.priceUsd > 0 && (
        <div className="absolute left-4 top-[38%] flex items-center gap-2">
          {/* chip */}
          <div
            className="w-7 h-5 rounded-[3px] relative overflow-hidden"
            style={{
              background:
                'linear-gradient(135deg, #D9C173 0%, #B79A4A 45%, #8E7430 100%)',
              boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.4)',
            }}
          >
            <div
              className="absolute inset-[15%]"
              style={{
                background:
                  'linear-gradient(90deg, transparent 24%, rgba(0,0,0,0.35) 24%, rgba(0,0,0,0.35) 26%, transparent 26%, transparent 48%, rgba(0,0,0,0.35) 48%, rgba(0,0,0,0.35) 50%, transparent 50%, transparent 72%, rgba(0,0,0,0.35) 72%, rgba(0,0,0,0.35) 74%, transparent 74%), linear-gradient(0deg, transparent 38%, rgba(0,0,0,0.35) 38%, rgba(0,0,0,0.35) 40%, transparent 40%, transparent 60%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.35) 62%, transparent 62%)',
              }}
            />
          </div>
          {/* NFC arcs — only on physical tiers */}
          {tier.physical && (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M3 11 C 5 9, 5 5, 3 3" stroke={ink} strokeOpacity="0.65" strokeWidth="1" strokeLinecap="round" />
              <path d="M6 12 C 9 9, 9 5, 6 2" stroke={ink} strokeOpacity="0.5" strokeWidth="1" strokeLinecap="round" />
              <path d="M9 13 C 13 9, 13 5, 9 1" stroke={ink} strokeOpacity="0.35" strokeWidth="1" strokeLinecap="round" />
            </svg>
          )}
        </div>
      )}

      {/* Card name + designer line */}
      <div className="absolute left-4 right-4 bottom-9">
        <div className="font-display text-[18px] leading-tight" style={{ color: ink, letterSpacing: '-0.01em' }}>
          {tier.name}
        </div>
        <div className="font-mono text-[9px] uppercase tracking-[0.14em] mt-0.5" style={{ color: inkSoft }}>
          {isSystem ? 'system issue' : isFreelancer ? 'freelance design · collectible' : 'brand-owner print · nfc'}
        </div>
      </div>

      {/* Bottom row — serial + run + price */}
      <div className="absolute left-4 right-4 bottom-3 flex items-end justify-between">
        <div className="font-mono text-[9px] tracking-[0.12em]" style={{ color: inkSoft }}>
          {serial}
          {tier.physical ? `  ·  /${tier.physical.runSize}` : ''}
        </div>
        <div className="font-mono text-[10px]" style={{ color: ink }}>
          {tier.priceUsd === 0 ? 'free' : `$${tier.priceUsd.toFixed(tier.priceUsd < 10 ? 2 : 0)}`}
        </div>
      </div>
    </div>
  );
}

function PassView() {
  // Stable demo serial per tier (would be issued on purchase in production).
  const serialFor = (level: number) => `№ 0000-${String(level).padStart(2, '0')}42`;
  return (
    <div className="space-y-5" data-testid="view-pass">
      <div>
        <div className="text-[10px] uppercase tracking-wider text-[#6B7785] font-mono mb-2">Revenue Pass</div>
        <p className="text-[13px] leading-relaxed text-[#1A1A1A]">
          Четыре тира · от бесплатного digital до физического collectible с NFC.
          Карты верхних тиров рисуют freelance-дизайнеры или владельцы бренда —
          это серийный предмет с marketing- и thank-you-слоями.
        </p>
      </div>
      {REVENUE_PASS_TIERS.map(t => (
        <div key={t.id} data-testid={`pass-tier-${t.id}`} className="space-y-2">
          <PassCardMock tier={t} serial={serialFor(t.level)} />
          <div
            className="rounded-xl border bg-white/70 px-3.5 py-3"
            style={{ borderColor: `${t.accent}33` }}
          >
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#6B7785] mb-1.5">
              {t.physical ? `${t.physical.material} · run /${t.physical.runSize}` : 'digital · no print'}
            </div>
            <ul className="space-y-1">
              {t.perks.map((p, i) => (
                <li key={i} className="text-[12px] leading-relaxed text-[#3a4148] flex gap-2">
                  <span className="text-[10px] mt-1" style={{ color: t.accent }}>▪</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
      <div className="text-[10px] font-mono text-[#6B7785] uppercase tracking-wider pt-1">
        Карты · без подписки · владелец = владелец
      </div>
    </div>
  );
}

function AboutView() {
  return (
    <div className="space-y-5" data-testid="view-about">
      <div>
        <div className="text-[10px] uppercase tracking-wider text-[#6B7785] font-mono mb-2">
          Что такое Tak-Tak
        </div>
        <p className="text-[14px] leading-relaxed text-[#1A1A1A]">
          {PITCH_RU.oneLiner}
        </p>
      </div>

      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-[#6B7785] font-mono">
          Три отличия от TikTok
        </div>
        {PITCH_RU.differentiators.map(d => (
          <div
            key={d.id}
            data-testid={`about-diff-${d.id}`}
            className="rounded-xl border border-black/5 bg-white/70 px-3 py-3"
          >
            <div className="flex items-baseline gap-2">
              <span className="text-base text-[#2E7D32]">{d.icon}</span>
              <div className="font-medium text-[13px] text-[#1A1A1A]">{d.title}</div>
            </div>
            <p className="mt-1 text-[12px] leading-relaxed text-[#3a4148]">{d.body}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-[#6B7785] font-mono">
          Принципы платформы
        </div>
        {PLATFORM_PRINCIPLES.map(p => (
          <div
            key={p.id}
            data-testid={`about-principle-${p.id}`}
            className="rounded-lg bg-black/[0.03] border border-black/5 px-3 py-2.5"
          >
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-[#F59E0B]">{p.icon}</span>
              <div className="text-[12px] font-medium text-[#1A1A1A]">{p.title}</div>
            </div>
            <p className="mt-0.5 text-[11px] leading-relaxed text-[#3a4148]">{p.body}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-[#6B7785] font-mono">
          Домены
        </div>
        <div className="grid grid-cols-2 gap-2">
          {([DOMAINS.mvp, DOMAINS.docs] as const).map(d => (
            <a
              key={d.url}
              href={d.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-black/5 bg-white/70 px-3 py-2.5 block hover:bg-white"
            >
              <div className="text-[11px] font-mono text-[#1A1A1A] truncate">{d.label}</div>
              <div className="text-[10px] text-[#6B7785]">{d.role}</div>
            </a>
          ))}
        </div>
      </div>

      <div className="pt-1 text-[10px] font-mono text-[#6B7785] uppercase tracking-wider">
        web 4.0 · Tak-Tak v0.7.2
      </div>
    </div>
  );
}
