// Give = patronage with physical revenue-pass cards (credit-card-sized previews).
// Four tiers:
//   • Spark   ($5)   — small backer pass, transferable
//   • Ember   ($25)  — revenue-share NFT pass · 3% of future spins
//   • Beacon  ($100) — revenue-share NFT pass · 12% + physical card mailed
//   • Invisible Charity (free amount) — anonymous: receiver may send back without knowing sender
//
// Each tier renders as a tangible, scannable plastic-card preview built in pure SVG.
// Hintology aesthetic: opaque white drawer, soft shadows, pill buttons, Inter.
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UnitManifest } from '@/lib/taktak-data';
import { useToast } from '@/hooks/use-toast';

type TierId = 't1' | 't2' | 't3' | 't4';

interface Tier {
  id: TierId;
  label: string;
  amount: number | null;        // null = user-defined amount (charity)
  sharePct: number;             // 0 for charity
  perks: string[];
  // Visual identity of the physical card
  hue: { from: string; to: string };
  symbol: string;
  kind: 'pass' | 'charity';
  intent: string;               // short manifesto under the title
}

const TIERS: Tier[] = [
  {
    id: 't1',
    label: 'Spark',
    amount: 5,
    sharePct: 0.5,
    perks: ['Backer badge на профиле', 'Ранний доступ к respin', '0.5% revshare на NFT'],
    hue: { from: '#E8F5E9', to: '#A5D6A7' },
    symbol: '✦',
    kind: 'pass',
    intent: 'малая благодарность · transferable pass',
  },
  {
    id: 't2',
    label: 'Ember',
    amount: 25,
    sharePct: 3,
    perks: ['Spark perks', '3% revenue-share NFT', 'Имя в credits', 'Pass можно перепродать'],
    hue: { from: '#FFF8E1', to: '#FFB74D' },
    symbol: '✧',
    kind: 'pass',
    intent: 'постоянный доход с будущих respin',
  },
  {
    id: 't3',
    label: 'Beacon',
    amount: 100,
    sharePct: 12,
    perks: ['Ember perks', '12% revenue-share NFT', 'Co-credit на major version', 'Физическая карта почтой'],
    hue: { from: '#FFEBEE', to: '#EF5350' },
    symbol: '✶',
    kind: 'pass',
    intent: 'patron tier · долгий партнёрский pass',
  },
  {
    id: 't4',
    label: 'Invisible Charity',
    amount: null,
    sharePct: 0,
    perks: [
      'Анонимная сумма по вашему выбору',
      'Получатель не знает отправителя',
      'Можно ответить даром в ответ — анонимно',
      'Без NFT, без revshare, без credits',
    ],
    hue: { from: '#ECEFF1', to: '#90A4AE' },
    symbol: '○',
    kind: 'charity',
    intent: 'тихая помощь · без имени, без следа',
  },
];

export function GiveDrawer({ unit, onClose }: { unit: UnitManifest; onClose: () => void }) {
  const [tierId, setTierId] = useState<TierId>('t2');
  const [charityAmount, setCharityAmount] = useState<number>(10);
  const { toast } = useToast();
  const selected = TIERS.find(t => t.id === tierId)!;

  const effectiveAmount = selected.kind === 'charity' ? charityAmount : (selected.amount ?? 0);
  const isCharity = selected.kind === 'charity';

  const onSubmit = () => {
    if (isCharity) {
      toast({
        title: '○ Тихий дар отправлен',
        description: `$${effectiveAmount} ушли автору · ваше имя скрыто · он может ответить тем же, не зная вас.`,
      });
    } else {
      toast({
        title: '♡ Pass отчеканен',
        description: `${selected.label} · ${selected.sharePct}% revshare · NFT в вашем кошельке`,
      });
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        style={{ background: 'rgba(20, 28, 36, 0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        data-testid="drawer-give"
      >
        <motion.div
          className="drawer-surface w-full sm:max-w-xl rounded-t-[24px] sm:rounded-[24px] overflow-hidden max-h-[92dvh] flex flex-col"
          initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <header className="px-6 pt-5 pb-4 border-b border-black/8 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg text-foreground">♡ Give · revenue passes</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Поддержка автора <span className="text-foreground">{unit.author.name}</span> поста «<span className="text-foreground">{unit.title}</span>»
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-muted-foreground"
                data-testid="button-close-give"
              >
                ✕
              </button>
            </div>
          </header>

          {/* CARD STACK — horizontally scrolling row of physical passes */}
          <div className="px-2 sm:px-4 py-5 overflow-x-auto no-scrollbar shrink-0">
            <div className="flex gap-3 px-3 min-w-min">
              {TIERS.map(t => (
                <PhysicalPassCard
                  key={t.id}
                  tier={t}
                  selected={tierId === t.id}
                  onSelect={() => setTierId(t.id)}
                  unit={unit}
                  amountOverride={t.kind === 'charity' ? charityAmount : undefined}
                />
              ))}
            </div>
            <div className="text-center text-[10px] text-muted-foreground/70 mt-2 font-mono">
              ← swipe · 4 passes · выбор подсвечен
            </div>
          </div>

          {/* DETAILS — perks + charity amount input */}
          <div className="px-6 py-4 border-t border-black/8 overflow-y-auto flex-1 min-h-0">
            <div className="flex items-baseline justify-between gap-3 mb-3">
              <div className="font-display text-base text-foreground">
                {selected.symbol} {selected.label}
              </div>
              <div className="text-xs text-muted-foreground">{selected.intent}</div>
            </div>

            {isCharity ? (
              <CharityAmountSelector amount={charityAmount} onChange={setCharityAmount} />
            ) : (
              <div className="grid grid-cols-3 gap-2 mb-3">
                <Stat label="Сумма" value={`$${selected.amount}`} />
                <Stat label="Revshare" value={`${selected.sharePct}%`} />
                <Stat label="Pass" value="NFT" />
              </div>
            )}

            <ul className="space-y-1.5 text-sm">
              {selected.perks.map((p, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">·</span>
                  <span className="text-foreground/85">{p}</span>
                </li>
              ))}
            </ul>

            {/* Money breakdown */}
            <div className="mt-4 rounded-2xl bg-black/[0.03] p-3 text-xs space-y-1">
              <Row label={isCharity ? 'Уходит автору (анонимно)' : 'Автор получает'} value={`$${(effectiveAmount * 0.95).toFixed(2)}`} />
              <Row label="Сетевой fee (gas + protocol)" value={`$${(effectiveAmount * 0.05).toFixed(2)}`} />
              {!isCharity && <Row label="Mint" value={`${selected.sharePct}% revshare NFT`} />}
              {isCharity && <Row label="Подпись отправителя" value="скрыта · zero-knowledge" />}
            </div>
          </div>

          {/* FOOTER ACTION */}
          <footer className="px-6 py-4 border-t border-black/8 bg-black/[0.02] flex items-center justify-between shrink-0 gap-3">
            <button
              onClick={onClose}
              className="text-sm text-muted-foreground hover:text-foreground"
              data-testid="button-cancel-give"
            >
              Отмена
            </button>
            <button
              onClick={onSubmit}
              disabled={isCharity && effectiveAmount <= 0}
              className="pill pill-primary px-5 py-2 text-[13px] disabled:opacity-40"
              data-testid="button-mint-pass"
            >
              {isCharity
                ? `○ Тихо отправить $${effectiveAmount}`
                : `♡ Get pass · $${effectiveAmount}`}
            </button>
          </footer>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ============================================================================
   PhysicalPassCard — credit-card-sized SVG preview of a revenue pass.
   Renders ~280×176px (1.6:1 banking-card ratio). Pure CSS+SVG so it scales.
============================================================================ */

function PhysicalPassCard({
  tier, selected, onSelect, unit, amountOverride,
}: {
  tier: Tier;
  selected: boolean;
  onSelect: () => void;
  unit: UnitManifest;
  amountOverride?: number;
}) {
  const isCharity = tier.kind === 'charity';
  const displayAmount = amountOverride ?? tier.amount;

  return (
    <button
      onClick={onSelect}
      data-testid={`pass-tier-${tier.id}`}
      data-no-swipe
      className={`relative shrink-0 transition-all duration-300 ${
        selected ? 'scale-[1.04]' : 'scale-100 opacity-85 hover:opacity-100'
      }`}
      style={{ filter: selected ? 'drop-shadow(0 14px 28px rgba(0,0,0,0.25))' : 'drop-shadow(0 6px 14px rgba(0,0,0,0.15))' }}
    >
      <div
        className={`relative w-[280px] h-[176px] rounded-[18px] overflow-hidden ${
          selected ? 'ring-2 ring-primary ring-offset-2 ring-offset-white' : ''
        }`}
        style={{
          background: `linear-gradient(135deg, ${tier.hue.from} 0%, ${tier.hue.to} 100%)`,
          color: isCharity ? '#263238' : '#1A1A1A',
        }}
      >
        {/* Subtle pattern overlay */}
        <svg
          className="absolute inset-0 w-full h-full opacity-25"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 280 176"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <pattern id={`grid-${tier.id}`} x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
              <path d="M14 0 L0 0 0 14" fill="none" stroke={isCharity ? '#FFFFFF55' : '#FFFFFF66'} strokeWidth="0.5" />
            </pattern>
            {isCharity && (
              <radialGradient id="charity-noise" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.1" />
              </radialGradient>
            )}
          </defs>
          <rect width="280" height="176" fill={`url(#grid-${tier.id})`} />
          {isCharity && <rect width="280" height="176" fill="url(#charity-noise)" />}
        </svg>

        {/* Chip */}
        <div
          className="absolute top-4 left-4 w-8 h-6 rounded-[4px]"
          style={{
            background: isCharity
              ? 'linear-gradient(135deg, #B0BEC5, #78909C)'
              : 'linear-gradient(135deg, #D4AF37 0%, #FFE082 50%, #B8860B 100%)',
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.15), inset 0 1px 2px rgba(255,255,255,0.4)',
          }}
        >
          <div className="absolute inset-1 grid grid-cols-3 grid-rows-2 gap-[1px]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-black/15 rounded-[0.5px]" />
            ))}
          </div>
        </div>

        {/* Tier name in top-right */}
        <div className="absolute top-3 right-4 text-right">
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] opacity-70">
            Tak-Tak · Pass
          </div>
          <div className="font-display text-base font-semibold leading-tight mt-0.5">
            {tier.symbol} {tier.label}
          </div>
        </div>

        {/* Author / unit (engraved) */}
        <div className="absolute bottom-12 left-4 right-4">
          <div className="text-[9px] font-mono uppercase tracking-wider opacity-60">
            {isCharity ? 'For author' : 'Bearer of share in'}
          </div>
          <div className="text-[13px] font-semibold leading-tight truncate mt-0.5">
            {isCharity ? unit.author.name : `«${unit.title}»`}
          </div>
          {!isCharity && (
            <div className="text-[10px] font-mono opacity-60 truncate">
              by @{unit.author.handle}
            </div>
          )}
        </div>

        {/* Bottom row: amount + revshare or charity badge */}
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
          <div>
            <div className="text-[8px] font-mono uppercase tracking-wider opacity-55">
              {isCharity ? 'Amount' : 'Locked'}
            </div>
            <div className="font-mono text-sm font-semibold leading-none mt-0.5">
              {displayAmount != null ? `$${displayAmount}` : '$—'}
            </div>
          </div>

          {isCharity ? (
            <div className="text-right">
              <div className="text-[8px] font-mono uppercase tracking-wider opacity-55">Identity</div>
              <div className="font-mono text-[11px] font-semibold leading-none mt-0.5">⌀ ANON</div>
            </div>
          ) : (
            <div className="text-right">
              <div className="text-[8px] font-mono uppercase tracking-wider opacity-55">Revenue share</div>
              <div className="font-mono text-sm font-semibold leading-none mt-0.5">{tier.sharePct}%</div>
            </div>
          )}
        </div>

        {/* Holographic strip on selected only — micro polish */}
        {selected && !isCharity && (
          <div
            className="absolute top-0 right-0 w-1.5 h-full"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.6))',
            }}
          />
        )}
      </div>

      {/* Selected badge below */}
      {selected && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 pill pill-primary text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5">
          выбрано
        </div>
      )}
    </button>
  );
}

function CharityAmountSelector({ amount, onChange }: { amount: number; onChange: (n: number) => void }) {
  const presets = [5, 10, 25, 50, 100];
  return (
    <div className="mb-3 space-y-2">
      <div className="text-xs text-muted-foreground">Сумма (ваш выбор)</div>
      <div className="flex flex-wrap gap-1.5">
        {presets.map(p => (
          <button
            key={p}
            onClick={() => onChange(p)}
            data-no-swipe
            className={`pill text-[12px] ${amount === p ? 'pill-primary' : 'pill-light'}`}
          >
            ${p}
          </button>
        ))}
        <div className="flex items-center gap-1 pill pill-light">
          <span className="font-mono text-[12px] text-muted-foreground">$</span>
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => onChange(Math.max(1, Number(e.target.value) || 0))}
            className="w-14 bg-transparent outline-none text-[12px] font-mono"
            data-testid="input-charity-amount"
            data-no-swipe
          />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-black/[0.04] px-3 py-2">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-mono text-sm text-foreground mt-0.5">{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-foreground">{value}</span>
    </div>
  );
}
