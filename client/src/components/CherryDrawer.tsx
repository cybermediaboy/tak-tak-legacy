// Cherry = legal borrowing of a piece of content/functionality/idea from
// another author's post INTO one of your own posts (or a new one).
//
// Flow:
//   1. Pick destination — one of your existing posts OR "new post"
//   2. Pick insertion template (or skip / use free prompt)
//   3. Free-form AI prompt: how and where to insert the cherry-picked piece
//   4. Submit → AI generates the AI-edit of destination; link-quote attribution
//      back to the source author is auto-attached. Free promo for source,
//      legal borrowing for you.
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UnitManifest } from '@/lib/taktak-data';
import { useToast } from '@/hooks/use-toast';

// Stubbed "my drafts/posts" — in production these would come from the user's library.
const MY_POSTS = [
  { id: 'mine-1', title: 'Стратегия mean-reversion на 4H · черновик',  kind: 'draft' as const, snippet: 'Заметки по нескольким сетапам OKX, без чёткого тезиса…' },
  { id: 'mine-2', title: 'Дайджест моих ботов · понедельник',           kind: 'post'  as const, snippet: 'Еженедельный отчёт о ботах в работе и их P&L за неделю.' },
  { id: 'mine-3', title: 'Pine-trick: KAMA как замена EMA',              kind: 'post'  as const, snippet: 'Короткая заметка о KAMA: меньше шумных пересечений в боковике…' },
];

interface TemplateOpt {
  id: string;
  icon: string;
  label: string;
  hint: string;
  prompt: string; // pre-fills the AI prompt textarea
}

const INSERT_TEMPLATES: TemplateOpt[] = [
  {
    id: 'quote',
    icon: '“ ”',
    label: 'Цитата',
    hint: 'Вставить как блок-цитату с подписью автора',
    prompt: 'Вставить ключевой фрагмент исходного поста как блок-цитату в подходящее место. Сохранить буквальный текст. Подпись: автор + ссылка обратно.',
  },
  {
    id: 'counter',
    icon: '⚔',
    label: 'Контраргумент',
    hint: 'Развернуть мою точку зрения против фрагмента',
    prompt: 'Использовать фрагмент исходного поста как тезис, на который я отвечаю своим контраргументом. Сначала суть исходной идеи (1–2 предложения), затем мой довод.',
  },
  {
    id: 'rewrite',
    icon: 'A',
    label: 'В моём голосе',
    hint: 'AI перепишет фрагмент в моём стиле',
    prompt: 'Переписать фрагмент исходного поста в моём личном стиле (короткие предложения, технический тон, без эпитетов). Смысл сохранить, формулировки — изменить.',
  },
  {
    id: 'extend',
    icon: '↗',
    label: 'Развить',
    hint: 'Расширить идею до собственного раздела',
    prompt: 'Взять идею из исходного поста как точку отправления и развить её в самостоятельный раздел моего поста. Минимум — практический пример из моей работы.',
  },
  {
    id: 'footnote',
    icon: '†',
    label: 'Сноска',
    hint: 'Положить фрагмент в footnote под основным текстом',
    prompt: 'Добавить фрагмент исходного поста как сноску внизу моего поста — компактно, со ссылкой на источник.',
  },
];

type Destination = string | 'new';

export function CherryDrawer({ unit, onClose }: { unit: UnitManifest; onClose: () => void }) {
  const [destination, setDestination] = useState<Destination>('mine-1');
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const { toast } = useToast();

  const pickTemplate = (t: TemplateOpt) => {
    setTemplateId(t.id);
    setPrompt(t.prompt);
  };

  const destLabel = (() => {
    if (destination === 'new') return 'новый пост';
    const p = MY_POSTS.find(p => p.id === destination);
    return p ? p.title : '—';
  })();

  const onSubmit = () => {
    if (!prompt.trim()) return;
    toast({
      title: '🍒 Cherry pick поставлен в очередь',
      description: `Кусок «${unit.title}» → ${destLabel}. AI-правка готовится, link-quote к @${unit.author.handle} прикреплена автоматически.`,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        style={{ background: 'rgba(20, 28, 36, 0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        data-testid="drawer-cherry"
      >
        <motion.div
          className="drawer-surface w-full sm:max-w-xl rounded-t-[24px] sm:rounded-[24px] overflow-hidden max-h-[92dvh] flex flex-col"
          initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <header className="px-6 pt-5 pb-4 border-b border-black/8 shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-display text-lg text-foreground">🍒 Cherry · заимствовать кусок</h3>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  Источник: «<span className="text-foreground">{unit.title}</span>» от @{unit.author.handle}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-muted-foreground shrink-0"
                data-testid="button-close-cherry"
              >
                ✕
              </button>
            </div>

            {/* Attribution preview chip */}
            <div className="mt-3 flex items-start gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-[11px] text-emerald-900">
              <span className="font-mono mt-0.5">↗</span>
              <div>
                <span className="font-medium">Атрибуция автоматическая.</span>{' '}
                После публикации в вашем посте появится link-quote: «cherry from <span className="font-mono">@{unit.author.handle}</span>». Бесплатная промо-ссылка для автора, легальное заимствование для вас.
              </div>
            </div>
          </header>

          <div className="px-6 py-4 overflow-y-auto flex-1 min-h-0 space-y-5">
            {/* STEP 1 — destination */}
            <section>
              <SectionTitle index="1" title="Куда вставить" />
              <div className="space-y-1.5">
                {MY_POSTS.map(p => (
                  <DestinationRow
                    key={p.id}
                    selected={destination === p.id}
                    onSelect={() => setDestination(p.id)}
                    title={p.title}
                    snippet={p.snippet}
                    badge={p.kind === 'draft' ? 'draft' : 'published'}
                    testid={`cherry-dest-${p.id}`}
                  />
                ))}
                <DestinationRow
                  selected={destination === 'new'}
                  onSelect={() => setDestination('new')}
                  title="→ Новый пост"
                  snippet="Создать пост с нуля, используя cherry как seed. Build-flow откроется после AI-генерации."
                  badge="new"
                  testid="cherry-dest-new"
                />
              </div>
            </section>

            {/* STEP 2 — template */}
            <section>
              <SectionTitle index="2" title="Как вставить (шаблон)" />
              <div className="flex flex-wrap gap-1.5">
                {INSERT_TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => pickTemplate(t)}
                    title={t.hint}
                    data-testid={`cherry-template-${t.id}`}
                    data-no-swipe
                    className={`pill text-[12px] ${templateId === t.id ? 'pill-primary' : 'pill-light'}`}
                  >
                    <span className="opacity-80">{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
                <button
                  onClick={() => { setTemplateId(null); setPrompt(''); }}
                  data-no-swipe
                  className={`pill text-[12px] ${templateId === null ? 'pill-dark' : 'pill-light'}`}
                  title="Без шаблона — свободные инструкции AI"
                >
                  ⟂ свободно
                </button>
              </div>
            </section>

            {/* STEP 3 — AI prompt */}
            <section>
              <SectionTitle index="3" title="Инструкции AI: что и куда вставить" />
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full h-28 rounded-2xl bg-black/[0.04] border border-black/8 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:bg-white"
                placeholder="Например: «Вставь раздел про trailing stop из источника после моего абзаца про risk model, в моём стиле, без таблиц.»"
                data-testid="textarea-cherry-prompt"
                data-no-swipe
              />
              <p className="text-[10px] text-muted-foreground mt-1.5">
                AI прочитает исходный пост, выберет релевантный фрагмент по вашим инструкциям и применит правку к destination. Вы получите diff на ревью перед публикацией.
              </p>
            </section>
          </div>

          {/* FOOTER */}
          <footer className="px-6 py-4 border-t border-black/8 bg-black/[0.02] flex items-center justify-between shrink-0 gap-3">
            <div className="text-[11px] text-muted-foreground min-w-0 flex-1">
              <span className="text-foreground">→</span> {destLabel}
            </div>
            <button
              onClick={onClose}
              className="text-sm text-muted-foreground hover:text-foreground"
              data-testid="button-cancel-cherry"
            >
              Отмена
            </button>
            <button
              onClick={onSubmit}
              disabled={!prompt.trim()}
              className="pill pill-primary px-5 py-2 text-[13px] disabled:opacity-40"
              data-testid="button-cherry-submit"
            >
              🍒 Cherry-pick → AI edit
            </button>
          </footer>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function SectionTitle({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-mono flex items-center justify-center">{index}</span>
      <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">{title}</span>
    </div>
  );
}

function DestinationRow({
  selected, onSelect, title, snippet, badge, testid,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  snippet: string;
  badge: 'draft' | 'published' | 'new';
  testid: string;
}) {
  const badgeStyle: Record<string, string> = {
    draft:     'bg-amber-100 text-amber-800 border-amber-200',
    published: 'bg-sky-100 text-sky-800 border-sky-200',
    new:       'bg-emerald-100 text-emerald-800 border-emerald-200',
  };
  const badgeLabel: Record<string, string> = {
    draft:     'черновик',
    published: 'опубликован',
    new:       'новый',
  };
  return (
    <button
      onClick={onSelect}
      data-testid={testid}
      data-no-swipe
      className={`w-full text-left rounded-2xl border transition-all p-3 ${
        selected
          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
          : 'border-black/8 bg-white hover:border-black/20'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="font-medium text-sm text-foreground flex-1 min-w-0 truncate">{title}</div>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider ${badgeStyle[badge]}`}>
          {badgeLabel[badge]}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{snippet}</p>
    </button>
  );
}
