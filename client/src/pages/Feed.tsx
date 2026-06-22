// Tak-Tak Feed: 2-D swipe coordinate plane.
// Horizontal = move between Spaces.
// Vertical   = move between Units within the active Space.
// Keyboard: ← → ↑ ↓ also work, plus 1..5 for direct space jump.

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { spaces, unitsBySpace, units as allUnits, type UnitManifest } from '@/lib/taktak-data';
import { UnitCard } from '@/components/UnitCard';
import { ActionRail } from '@/components/ActionRail';
import { RespinDrawer } from '@/components/RespinDrawer';
import { GiveDrawer } from '@/components/GiveDrawer';
import { CherryDrawer } from '@/components/CherryDrawer';
import { TemplateDrawer } from '@/components/TemplateDrawer';
import { BuildFab } from '@/components/BuildFab';
import { UserDrawer, currentUser, type UserView } from '@/components/UserDrawer';
import { useToast } from '@/hooks/use-toast';

export default function Feed() {
  const [spaceIdx, setSpaceIdx] = useState(0);
  const [unitIdx, setUnitIdx] = useState(0);
  const [drawer, setDrawer] = useState<null | { kind: 'respin' | 'give' | 'cherry'; unit: UnitManifest } | { kind: 'template'; spaceId: string } | { kind: 'user'; view: UserView }>(null);
  const { toast } = useToast();

  const space = spaces[spaceIdx];
  const units = unitsBySpace[space.id] ?? [];
  const unit = units[unitIdx];

  // Reset unit index when changing space
  useEffect(() => { setUnitIdx(0); }, [spaceIdx]);

  const moveSpace = useCallback((delta: number) => {
    setSpaceIdx(i => Math.max(0, Math.min(spaces.length - 1, i + delta)));
  }, []);
  const moveUnit = useCallback((delta: number) => {
    setUnitIdx(i => Math.max(0, Math.min(units.length - 1, i + delta)));
  }, [units.length]);

  // Keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (drawer) return;
      if (e.key === 'ArrowLeft')  { e.preventDefault(); moveSpace(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); moveSpace(+1); }
      if (e.key === 'ArrowUp')    { e.preventDefault(); moveUnit(-1); }
      if (e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); moveUnit(+1); }
      const n = parseInt(e.key, 10);
      if (!Number.isNaN(n) && n >= 1 && n <= spaces.length) { setSpaceIdx(n - 1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moveSpace, moveUnit, drawer]);

  // Hyperlink graph navigation: jump to target unit across spaces.
  const handleLinkClick = useCallback((targetUnitId: string) => {
    const target = allUnits.find(u => u.id === targetUnitId);
    if (!target) return;
    const targetSpaceIdx = spaces.findIndex(s => s.id === target.spaceId);
    if (targetSpaceIdx === -1) return;
    const targetUnits = unitsBySpace[target.spaceId] ?? [];
    const targetUnitIdx = targetUnits.findIndex(u => u.id === targetUnitId);
    if (targetUnitIdx === -1) return;
    setSpaceIdx(targetSpaceIdx);
    // setUnitIdx fires after the space-change effect resets to 0 — schedule on next tick.
    setTimeout(() => setUnitIdx(targetUnitIdx), 0);
    toast({ title: '→ Переход по гиперссылке', description: `${target.spaceId} · ${target.title}` });
  }, [toast]);

  const handleAction = (action: 'respin' | 'give' | 'cherry' | 'react' | 'share', u: UnitManifest) => {
    if (action === 'react') {
      toast({ title: '✦ Signal sent', description: `Reaction recorded · author rep +0.1` });
      return;
    }
    if (action === 'share') {
      toast({ title: '↗ Ссылка скопирована', description: `${u.title} · ${u.spaceId}/${u.id}` });
      return;
    }
    setDrawer({ kind: action as 'respin' | 'give' | 'cherry', unit: u });
  };

  // Swipe gestures — native touch + pointer events via addEventListener so we can use
  // {passive: false}. React synthetic touch events on iOS Safari are unreliable here;
  // `touch-action: none` in CSS alone doesn't always allow JS-driven swipes.
  const rootRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<{ startX: number; startY: number; startT: number; active: boolean; locked: 'h' | 'v' | null; scrollEl: HTMLElement | null }>({
    startX: 0, startY: 0, startT: 0, active: false, locked: null, scrollEl: null,
  });

  // Block swipe only when the gesture started on an explicitly interactive control.
  // Scrollable payload areas are NOT blocked here — we decide per-direction in touchmove
  // (vertical scroll wins only if the payload can actually scroll further in that direction).
  const isInteractiveTarget = (el: EventTarget | null) => {
    const node = el as HTMLElement | null;
    if (!node || !node.closest) return false;
    return !!node.closest('button, input, textarea, a, [role="slider"], [data-testid^="fn-"], [data-testid^="pass-tier-"], [data-no-swipe]');
  };

  // Find the nearest vertically-scrollable ancestor inside the card payload (if any).
  const findScrollableAncestor = (el: HTMLElement | null): HTMLElement | null => {
    let n = el;
    while (n && n !== document.body) {
      const overflowY = getComputedStyle(n).overflowY;
      if ((overflowY === 'auto' || overflowY === 'scroll') && n.scrollHeight > n.clientHeight) return n;
      n = n.parentElement;
    }
    return null;
  };

  const beginGesture = (x: number, y: number, target: EventTarget | null) => {
    if (isInteractiveTarget(target)) { gestureRef.current.active = false; return; }
    gestureRef.current = { startX: x, startY: y, startT: Date.now(), active: true, locked: null, scrollEl: findScrollableAncestor(target as HTMLElement | null) } as any;
  };

  const endGesture = (x: number, y: number) => {
    const g = gestureRef.current;
    if (!g.active) return;
    g.active = false;
    const dx = x - g.startX;
    const dy = y - g.startY;
    const dt = Math.max(1, Date.now() - g.startT);
    const absX = Math.abs(dx), absY = Math.abs(dy);
    const distMin = 50;
    const velMin = 0.35;
    const horiz = absX > absY;
    if (horiz) {
      if (absX > distMin || absX / dt > velMin) {
        if (dx < 0) moveSpace(+1); else moveSpace(-1);
      }
    } else {
      if (absY > distMin || absY / dt > velMin) {
        if (dy < 0) moveUnit(+1); else moveUnit(-1);
      }
    }
  };

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    const onTouchStart = (e: TouchEvent) => {
      if (drawer) return;
      const t = e.touches[0]; if (!t) return;
      beginGesture(t.clientX, t.clientY, e.target);
    };
    const onTouchMove = (e: TouchEvent) => {
      const g = gestureRef.current;
      if (!g.active) return;
      const t = e.touches[0]; if (!t) return;
      const dx = t.clientX - g.startX;
      const dy = t.clientY - g.startY;
      if (g.locked === null && Math.max(Math.abs(dx), Math.abs(dy)) > 10) {
        const horiz = Math.abs(dx) > Math.abs(dy);
        // If the gesture is vertical AND the scrollable can still scroll in that direction,
        // surrender to native scroll — do not lock as a vertical swipe.
        if (!horiz && g.scrollEl) {
          const goingDown = dy < 0;
          const canScrollDown = g.scrollEl.scrollTop + g.scrollEl.clientHeight < g.scrollEl.scrollHeight - 1;
          const canScrollUp = g.scrollEl.scrollTop > 0;
          if ((goingDown && canScrollDown) || (!goingDown && canScrollUp)) {
            g.active = false;
            return;
          }
        }
        g.locked = horiz ? 'h' : 'v';
      }
      if (g.locked && e.cancelable) e.preventDefault();
    };
    const onTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0]; if (!t) return;
      endGesture(t.clientX, t.clientY);
    };
    const onTouchCancel = () => { gestureRef.current.active = false; };

    const onPointerDownNative = (e: PointerEvent) => {
      if (drawer) return;
      if (e.pointerType === 'touch') return;
      beginGesture(e.clientX, e.clientY, e.target);
    };
    const onPointerUpNative = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      endGesture(e.clientX, e.clientY);
    };

    node.addEventListener('touchstart', onTouchStart, { passive: true });
    node.addEventListener('touchmove', onTouchMove, { passive: false });
    node.addEventListener('touchend', onTouchEnd, { passive: true });
    node.addEventListener('touchcancel', onTouchCancel, { passive: true });
    node.addEventListener('pointerdown', onPointerDownNative);
    node.addEventListener('pointerup', onPointerUpNative);
    node.addEventListener('pointercancel', onTouchCancel);

    return () => {
      node.removeEventListener('touchstart', onTouchStart);
      node.removeEventListener('touchmove', onTouchMove);
      node.removeEventListener('touchend', onTouchEnd);
      node.removeEventListener('touchcancel', onTouchCancel);
      node.removeEventListener('pointerdown', onPointerDownNative);
      node.removeEventListener('pointerup', onPointerUpNative);
      node.removeEventListener('pointercancel', onTouchCancel);
    };
  }, [drawer, moveSpace, moveUnit]);

  // Wheel/trackpad: snap-scroll to next/prev unit/space.
  const wheelLock = useState(false);
  const [isWheelLocked, setWheelLocked] = wheelLock;
  const onWheel = (e: React.WheelEvent) => {
    if (isWheelLocked || drawer) return;
    const absX = Math.abs(e.deltaX), absY = Math.abs(e.deltaY);
    if (Math.max(absX, absY) < 30) return;
    if (absX > absY) {
      if (e.deltaX > 0) moveSpace(+1); else moveSpace(-1);
    } else {
      if (e.deltaY > 0) moveUnit(+1); else moveUnit(-1);
    }
    setWheelLocked(true);
    setTimeout(() => setWheelLocked(false), 350);
  };

  return (
    <div
      ref={rootRef}
      className="h-[100dvh] w-full overflow-hidden relative select-none"
      style={{ touchAction: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none', overscrollBehavior: 'none' }}
      onWheel={onWheel}
    >
      <TopBar
        spaceIdx={spaceIdx}
        setSpaceIdx={setSpaceIdx}
        onOpenTemplate={() => setDrawer({ kind: 'template', spaceId: space.id })}
        onOpenUser={() => setDrawer({ kind: 'user', view: 'menu' })}
      />

      {/* Card fills the entire viewport. TopBar and BottomDock float over it as glass capsules. */}
      <div className="absolute inset-0 flex items-stretch justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${space.id}-${unit?.id ?? 'empty'}`}
            className="w-full h-full flex items-stretch justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {unit ? <UnitCard unit={unit} onAction={handleAction} onLinkClick={handleLinkClick} /> : <EmptySpace />}
          </motion.div>
        </AnimatePresence>
      </div>

      {unit && <ActionRail unit={unit} onAction={handleAction} />}

      <NavHints unitIdx={unitIdx} totalUnits={units.length} />

      <BuildFab />

      {/* Drawers */}
      {drawer?.kind === 'respin' && 'unit' in drawer && <RespinDrawer unit={drawer.unit} onClose={() => setDrawer(null)} />}
      {drawer?.kind === 'give'   && 'unit' in drawer && <GiveDrawer   unit={drawer.unit} onClose={() => setDrawer(null)} />}
      {drawer?.kind === 'cherry' && 'unit' in drawer && <CherryDrawer unit={drawer.unit} onClose={() => setDrawer(null)} />}
      {drawer?.kind === 'template' && 'spaceId' in drawer && <TemplateDrawer space={spaces.find(s => s.id === drawer.spaceId)!} onClose={() => setDrawer(null)} />}
      {drawer?.kind === 'user' && 'view' in drawer && <UserDrawer initialView={drawer.view} onClose={() => setDrawer(null)} />}
    </div>
  );
}

function TopBar({ spaceIdx, setSpaceIdx, onOpenTemplate, onOpenUser }: { spaceIdx: number; setSpaceIdx: (n: number) => void; onOpenTemplate: () => void; onOpenUser: () => void }) {
  // Sticky-pinned spaces: For You + Local. Rest scrolls horizontally inside the strip.
  const stickyIds = ['s1', 's9'];
  const stickyEntries = stickyIds
    .map(id => ({ s: spaces.find(x => x.id === id), idx: spaces.findIndex(x => x.id === id) }))
    .filter(x => x.s) as Array<{ s: typeof spaces[number]; idx: number }>;
  const scrollableEntries = spaces
    .map((s, idx) => ({ s, idx }))
    .filter(({ s }) => !stickyIds.includes(s.id));

  const scrollRef = useRef<HTMLDivElement>(null);
  // Keep the active scrollable pill visible.
  useEffect(() => {
    const el = scrollRef.current?.querySelector<HTMLElement>('[data-active-pill="true"]');
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [spaceIdx]);

  // Channel pills (scrollable, on the right).
  const channelCls = (active: boolean) =>
    `shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all ${
      active
        ? 'bg-[#4CAF50]/20 text-[#2E7D32] border border-[#4CAF50]/40'
        : 'text-[#1A1A1A]/75 hover:text-[#1A1A1A] bg-white/55 border border-black/5'
    }`;
  // Filter-view pills (sticky, on the left). Visually distinct: amber tone
  // + dashed border + filter-icon prefix to convey "this is a lens, not a channel".
  const filterCls = (active: boolean) =>
    `shrink-0 flex items-center gap-1 rounded-full pl-2 pr-3 py-1.5 text-[11px] font-semibold transition-all border-dashed ${
      active
        ? 'bg-amber-500/25 text-amber-900 border border-dashed border-amber-600/60 ring-1 ring-amber-400/40'
        : 'bg-amber-500/10 text-amber-900/85 border border-dashed border-amber-600/35 hover:bg-amber-500/20'
    }`;

  return (
    <div className="absolute top-0 inset-x-0 z-30 px-3 pt-3 pb-2 pointer-events-none" data-testid="top-bar">
      {/* Row 1: user pill (left) + info button (right, opens template manifest) */}
      <div className="flex items-center gap-2 pointer-events-auto mb-2">
        <button
          onClick={onOpenUser}
          data-testid="top-user-pill"
          data-no-swipe
          title="Меню · Earnings · Профиль"
          className="glass rounded-full pl-1 pr-2 py-1 flex items-center gap-1.5 hover:bg-white/90 transition-colors shrink-0"
        >
          <span className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400/40 to-amber-400/40 border border-black/10 flex items-center justify-center text-sm leading-none">
            {currentUser.avatar}
          </span>
          <span className="text-[10px] font-mono text-[#1A1A1A]">@{currentUser.handle.split('.')[0]}</span>
        </button>

        <div className="flex-1" />

        {/* Lightweight info button — opens template manifest for the active space. No name shown. */}
        <button
          onClick={onOpenTemplate}
          data-testid="top-space-info"
          data-no-swipe
          title="О Space-шаблоне: engine, экономика, форки"
          className="glass rounded-full w-8 h-8 flex items-center justify-center hover:bg-white/90 transition-colors shrink-0"
        >
          <span className="text-[#6B7785] text-base leading-none">ⓘ</span>
        </button>
      </div>

      {/* Row 2: spaces strip — sticky [For You][Local] + scrollable rest */}
      <div className="glass rounded-full p-1 flex items-stretch gap-1 pointer-events-auto min-w-0" data-testid="spaces-strip">
        {stickyEntries.map(({ s, idx }) => (
          <button
            key={s.id}
            onClick={() => setSpaceIdx(idx)}
            data-testid={`strip-filter-${s.id}`}
            data-active-pill={spaceIdx === idx ? 'true' : undefined}
            data-no-swipe
            title={`${s.name} — filter-view, not a channel`}
            className={filterCls(spaceIdx === idx)}
          >
            {/* funnel icon to signal filter-view */}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="opacity-80">
              <path d="M3 5h18l-7 9v6l-4-2v-4L3 5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            </svg>
            <span className="text-sm leading-none">{s.icon}</span>
            <span>{s.name}</span>
          </button>
        ))}

        {/* Divider between sticky and scrollable */}
        <div className="w-px self-stretch bg-black/10 my-1" />

        {/* Scrollable rest */}
        <div
          ref={scrollRef}
          className="flex-1 min-w-0 overflow-x-auto no-scrollbar flex gap-1 scroll-smooth"
          style={{ scrollSnapType: 'x proximity' }}
          data-testid="strip-scroll"
          data-no-swipe
        >
          {scrollableEntries.map(({ s, idx }) => (
            <button
              key={s.id}
              onClick={() => setSpaceIdx(idx)}
              data-testid={`strip-channel-${s.id}`}
              data-active-pill={spaceIdx === idx ? 'true' : undefined}
              data-no-swipe
              style={{ scrollSnapAlign: 'start' }}
              className={channelCls(spaceIdx === idx)}
            >
              <span className="text-sm leading-none">{s.icon}</span>
              <span>{s.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function NavHints({ unitIdx, totalUnits }: { unitIdx: number; totalUnits: number }) {
  return (
    <>
      {/* Vertical dots (units) — left edge */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-10">
        {Array.from({ length: totalUnits }).map((_, i) => (
          <span key={i} className={`w-1 rounded-full transition-all shadow-sm ${i === unitIdx ? 'h-6 bg-[#4CAF50]' : 'h-1.5 bg-white/70'}`} />
        ))}
      </div>
      {/* Bottom hint */}
      <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none">
        <div className="text-[10px] text-white/85 font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
          ← → spaces · ↑ ↓ units · swipe to navigate
        </div>
      </div>
    </>
  );
}

function EmptySpace() {
  return <div className="glass rounded-2xl px-6 py-4 text-[#1A1A1A] text-sm self-center">No units in this space yet.</div>;
}

function Logo() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-label="Tak-Tak logo">
      <circle cx="12" cy="12" r="11" stroke="currentColor" strokeOpacity="0.25" />
      <circle cx="8" cy="12" r="2.2" fill="currentColor" className="text-primary" />
      <circle cx="16" cy="12" r="2.2" fill="currentColor" className="text-accent" />
      <path d="M8 12 L16 12" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1" />
    </svg>
  );
}
