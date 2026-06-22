// Build FAB — tap "+" expands a fan of 3 options:
//   • Handmade  — write the post yourself, no AI
//   • Respin    — fork an existing post (pick source)
//   • Freelance — commission via a guild (pick guild, budget)
//
// Each option opens its own opaque white drawer with a tailored form.
// Hintology aesthetic: dark glass FAB, opaque drawers, pill buttons.
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

type Mode = null | 'handmade' | 'respin' | 'freelance';

const ORIGIN_COLORS = {
  handmade:   '#2E7D32',
  respin:     '#1E88E5',
  freelance:  '#F9A825',
} as const;

export function BuildFab() {
  const [fanOpen, setFanOpen] = useState(false);
  const [mode, setMode] = useState<Mode>(null);

  return (
    <>
      {/* Backdrop while fan is open — taps close the fan */}
      <AnimatePresence>
        {fanOpen && (
          <motion.div
            className="fixed inset-0 z-30"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setFanOpen(false)}
            data-testid="fab-backdrop"
          />
        )}
      </AnimatePresence>

      {/* FAN OPTIONS — only visible when open */}
      <AnimatePresence>
        {fanOpen && (
          <>
            <FanOption
              label="Handmade"
              icon="✋"
              color={ORIGIN_COLORS.handmade}
              hint="Написать пост вручную, без AI"
              testid="fab-option-handmade"
              x={-72} y={-12}
              delay={0.02}
              onClick={() => { setFanOpen(false); setMode('handmade'); }}
            />
            <FanOption
              label="Respin"
              icon="↻"
              color={ORIGIN_COLORS.respin}
              hint="Форк существующего поста с AI-правкой"
              testid="fab-option-respin"
              x={-58} y={-66}
              delay={0.06}
              onClick={() => { setFanOpen(false); setMode('respin'); }}
            />
            <FanOption
              label="Freelance"
              icon="⚑"
              color={ORIGIN_COLORS.freelance}
              hint="Заказать в гильдии с бюджетом"
              testid="fab-option-freelance"
              x={-12} y={-104}
              delay={0.1}
              onClick={() => { setFanOpen(false); setMode('freelance'); }}
            />
          </>
        )}
      </AnimatePresence>

      {/* THE FAB itself */}
      <button
        onClick={() => setFanOpen(o => !o)}
        className="absolute right-3 bottom-[88px] z-40 w-13 h-13 flex items-center justify-center shadow-xl active:scale-95 transition-transform"
        style={{
          width: 52, height: 52,
          borderRadius: 9999,
          background: 'rgba(30, 40, 50, 0.92)',
          color: 'white',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
        title="Создать пост"
        data-testid="fab-build"
      >
        <motion.span
          animate={{ rotate: fanOpen ? 45 : 0 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="text-2xl leading-none font-light"
        >
          +
        </motion.span>
      </button>

      {/* Mode-specific drawers */}
      {mode === 'handmade'  && <HandmadeDrawer  onClose={() => setMode(null)} />}
      {mode === 'respin'    && <RespinStubDrawer onClose={() => setMode(null)} />}
      {mode === 'freelance' && <FreelanceDrawer onClose={() => setMode(null)} />}
    </>
  );
}

function FanOption({
  label, icon, color, hint, x, y, delay, testid, onClick,
}: { label: string; icon: string; color: string; hint: string; x: number; y: number; delay: number; testid: string; onClick: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, x: 0, y: 0, scale: 0.6 }}
      animate={{ opacity: 1, x, y, scale: 1 }}
      exit={{ opacity: 0, x: 0, y: 0, scale: 0.6 }}
      transition={{ delay, duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      title={hint}
      data-testid={testid}
      className="absolute right-3 bottom-[88px] z-40 flex items-center gap-2 pl-3 pr-4 py-2 rounded-full shadow-lg"
      style={{
        background: 'white',
        boxShadow: `0 8px 22px -4px ${color}55, 0 2px 6px rgba(0,0,0,0.1)`,
        border: `1px solid ${color}33`,
      }}
    >
      <span
        className="w-7 h-7 rounded-full flex items-center justify-center text-base"
        style={{ background: color, color: 'white' }}
      >
        {icon}
      </span>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </motion.button>
  );
}

/* =====================================================
   HANDMADE — write your own post; AI off.
====================================================== */
function HandmadeDrawer({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [space, setSpace] = useState('s1');
  const { toast } = useToast();
  return (
    <SubmitShell onClose={onClose} icon="✋" iconColor={ORIGIN_COLORS.handmade}
      title="Handmade post" subtitle="Без AI · вы пишете руками, отметка origin = handmade"
      canSubmit={title.trim().length > 2 && body.trim().length > 8}
      submitLabel="Опубликовать"
      onSubmit={() => { toast({ title: '✋ Handmade post опубликован', description: title }); onClose(); }}>
      <FieldLabel>Заголовок</FieldLabel>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Например: KAMA как замена EMA в боковике"
        className="w-full rounded-xl bg-black/[0.04] border border-black/8 px-3 py-2 text-sm outline-none focus:bg-white focus:border-primary/50"
        data-testid="input-handmade-title"
        data-no-swipe
      />
      <FieldLabel className="mt-3">Текст</FieldLabel>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Свой текст. Без AI-правок."
        className="w-full h-32 rounded-xl bg-black/[0.04] border border-black/8 px-3 py-2 text-sm outline-none focus:bg-white focus:border-primary/50"
        data-testid="textarea-handmade-body"
        data-no-swipe
      />
      <FieldLabel className="mt-3">Space</FieldLabel>
      <SpacePicker value={space} onChange={setSpace} />
    </SubmitShell>
  );
}

/* =====================================================
   RESPIN — fork an existing post (stub: ask for source URL/id)
====================================================== */
function RespinStubDrawer({ onClose }: { onClose: () => void }) {
  const [source, setSource] = useState('');
  const [edit, setEdit] = useState('');
  const [budget, setBudget] = useState(0);
  const { toast } = useToast();
  return (
    <SubmitShell onClose={onClose} icon="↻" iconColor={ORIGIN_COLORS.respin}
      title="Respin post" subtitle="Форк существующего поста с LLM-правкой · revshare идёт оригинальному автору"
      canSubmit={source.trim().length > 1 && edit.trim().length > 8}
      submitLabel="Сгенерировать respin"
      onSubmit={() => { toast({ title: '↻ Respin поставлен в очередь', description: `Источник: ${source}` }); onClose(); }}>
      <FieldLabel>ID или ссылка исходного поста</FieldLabel>
      <input
        value={source}
        onChange={(e) => setSource(e.target.value)}
        placeholder="u3 или https://tak-tak/p/u3"
        className="w-full rounded-xl bg-black/[0.04] border border-black/8 px-3 py-2 text-sm font-mono outline-none focus:bg-white focus:border-primary/50"
        data-testid="input-respin-source"
        data-no-swipe
      />
      <FieldLabel className="mt-3">Что изменить (LLM)</FieldLabel>
      <textarea
        value={edit}
        onChange={(e) => setEdit(e.target.value)}
        placeholder="Например: «Добавь backtest на ETH, уменьши плечо до 3x, переведи в мой стиль»"
        className="w-full h-24 rounded-xl bg-black/[0.04] border border-black/8 px-3 py-2 text-sm outline-none focus:bg-white focus:border-primary/50"
        data-testid="textarea-respin-edit"
        data-no-swipe
      />
      <FieldLabel className="mt-3">Бюджет на respin (если пост платный)</FieldLabel>
      <input
        type="number"
        min={0}
        value={budget}
        onChange={(e) => setBudget(Math.max(0, Number(e.target.value) || 0))}
        className="w-32 rounded-xl bg-black/[0.04] border border-black/8 px-3 py-2 text-sm font-mono outline-none focus:bg-white focus:border-primary/50"
        data-testid="input-respin-budget"
        data-no-swipe
      />
    </SubmitShell>
  );
}

/* =====================================================
   FREELANCE — commission a guild member
====================================================== */
const GUILDS = [
  { id: 'slow-makers',   label: 'Slow Makers',   hint: 'Эссе, лонгриды, заметки' },
  { id: 'pocket-builders', label: 'Pocket Builders', hint: 'Мини-приложения, калькуляторы' },
  { id: 'agents-guild',  label: 'Agents Guild',  hint: 'LLM-агенты, MCP-инструменты' },
];

function FreelanceDrawer({ onClose }: { onClose: () => void }) {
  const [brief, setBrief] = useState('');
  const [guild, setGuild] = useState('pocket-builders');
  const [budget, setBudget] = useState(50);
  const { toast } = useToast();
  return (
    <SubmitShell onClose={onClose} icon="⚑" iconColor={ORIGIN_COLORS.freelance}
      title="Freelance · заказ в гильдии"
      subtitle="Бриф уходит мастерам гильдии · вы платите по факту · origin = freelanced"
      canSubmit={brief.trim().length > 12 && budget >= 5}
      submitLabel={`Опубликовать бриф · $${budget}`}
      onSubmit={() => { toast({ title: '⚑ Бриф отправлен в гильдию', description: `${guild} · бюджет $${budget}` }); onClose(); }}>
      <FieldLabel>Бриф</FieldLabel>
      <textarea
        value={brief}
        onChange={(e) => setBrief(e.target.value)}
        placeholder="Опишите, что нужно сделать. Чем конкретнее — тем точнее предложения."
        className="w-full h-28 rounded-xl bg-black/[0.04] border border-black/8 px-3 py-2 text-sm outline-none focus:bg-white focus:border-primary/50"
        data-testid="textarea-freelance-brief"
        data-no-swipe
      />
      <FieldLabel className="mt-3">Гильдия</FieldLabel>
      <div className="space-y-1.5">
        {GUILDS.map(g => (
          <button
            key={g.id}
            onClick={() => setGuild(g.id)}
            data-testid={`freelance-guild-${g.id}`}
            data-no-swipe
            className={`w-full text-left rounded-xl border p-2.5 transition-all ${
              guild === g.id
                ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                : 'border-black/8 bg-white hover:border-black/20'
            }`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-medium text-sm">⚑ {g.label}</span>
              <span className="text-[10px] font-mono text-muted-foreground">{g.id}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{g.hint}</p>
          </button>
        ))}
      </div>
      <FieldLabel className="mt-3">Бюджет (USD)</FieldLabel>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={5}
          value={budget}
          onChange={(e) => setBudget(Math.max(5, Number(e.target.value) || 0))}
          className="w-32 rounded-xl bg-black/[0.04] border border-black/8 px-3 py-2 text-sm font-mono outline-none focus:bg-white focus:border-primary/50"
          data-testid="input-freelance-budget"
          data-no-swipe
        />
        <span className="text-xs text-muted-foreground">5% — комиссия сети, 95% — мастеру</span>
      </div>
    </SubmitShell>
  );
}

/* =====================================================
   SHARED — drawer shell, labels, space picker
====================================================== */
function SubmitShell({
  onClose, icon, iconColor, title, subtitle, children, canSubmit, submitLabel, onSubmit,
}: {
  onClose: () => void; icon: string; iconColor: string; title: string; subtitle: string;
  children: React.ReactNode; canSubmit: boolean; submitLabel: string; onSubmit: () => void;
}) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        style={{ background: 'rgba(20, 28, 36, 0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="drawer-surface w-full sm:max-w-lg rounded-t-[24px] sm:rounded-[24px] overflow-hidden max-h-[92dvh] flex flex-col"
          initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
        >
          <header className="px-5 pt-5 pb-4 border-b border-black/8 shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center text-base text-white shrink-0"
                  style={{ background: iconColor }}
                >
                  {icon}
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-base text-foreground">{title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-muted-foreground shrink-0">✕</button>
            </div>
          </header>
          <div className="px-5 py-4 flex-1 min-h-0 overflow-y-auto">{children}</div>
          <footer className="px-5 py-3 border-t border-black/8 bg-black/[0.02] flex items-center justify-between gap-3 shrink-0">
            <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">Отмена</button>
            <button
              onClick={onSubmit}
              disabled={!canSubmit}
              className="pill pill-primary px-5 py-2 text-[13px] disabled:opacity-40"
            >
              {submitLabel}
            </button>
          </footer>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function FieldLabel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5 ${className}`}>
      {children}
    </div>
  );
}

const SPACES_QUICK = [
  { id: 's1', name: 'For You' },
  { id: 's2', name: 'Quant Lab' },
  { id: 's3', name: 'Pocket Tools' },
  { id: 's4', name: 'Slow Market' },
  { id: 's5', name: 'Agents Guild' },
];

function SpacePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {SPACES_QUICK.map(s => (
        <button
          key={s.id}
          onClick={() => onChange(s.id)}
          data-no-swipe
          className={`pill text-[12px] ${value === s.id ? 'pill-primary' : 'pill-light'}`}
        >
          {s.name}
        </button>
      ))}
    </div>
  );
}
