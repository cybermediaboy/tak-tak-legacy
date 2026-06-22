// Respin = single-button modification. Replaces Spin + Build flows.
// One text field (or voice) describing what to change.
// User profile / company data auto-injected. Micro-payment shown inline if license is paid.

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UnitManifest, LicenseKind } from '@/lib/taktak-data';
import { licenseLabel } from '@/lib/taktak-data';
import { useToast } from '@/hooks/use-toast';

// Mock "my profile" — in production this comes from the user's account / wallet.
const MY_PROFILE = {
  handle: 'johny.mediaboy',
  company: 'CyberMediaboy LLC',
  vatId: 'CY10458201X',
  brandColors: ['#22D3EE', '#F59E0B'],
  defaultMcp: ['mcp://accounts/cybermediaboy', 'mcp://payments/stripe-cmb'],
  llmKeys: ['anthropic:haiku-4.5', 'gemini:2.5-flash', 'bittensor:sn19'],
};

const QUICK_PROMPTS = [
  'Сделай такое же, только для моей компании — данные подтяни из профиля',
  'Замени биржу на OKX и добавь альтсезон-фильтр',
  'Переведи на русский, оставь логику без изменений',
  'Сделай темнее и компактнее, под мобильный',
];

export function RespinDrawer({ unit, onClose }: { unit: UnitManifest; onClose: () => void }) {
  const [instruction, setInstruction] = useState('');
  const [license, setLicense] = useState<LicenseKind>(unit.license.kind);
  const [step, setStep] = useState<'compose' | 'preview' | 'published'>('compose');
  const [useMyData, setUseMyData] = useState(true);
  const { toast } = useToast();

  const paidPrice = unit.license.spinPrice ?? 0;
  const revShare = (unit.license.revenueShareBps ?? 0) / 100;
  const isPaid = paidPrice > 0;

  // Mock LLM-generated diff preview (text only, deterministic from instruction)
  const previewDiff = useMemo(() => {
    if (!instruction.trim()) return null;
    return generateMockDiff(unit, instruction, useMyData ? MY_PROFILE : null);
  }, [unit, instruction, useMyData]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-end sm:items-center justify-center"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        data-testid="drawer-respin"
      >
        <motion.div
          className="w-full sm:max-w-lg bg-card border border-card-border rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
          initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          <header className="px-5 pt-5 pb-3 border-b border-card-border">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg">↺ Respin</h3>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground" data-testid="button-close-respin">✕</button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Опишите, что изменить. LLM применит изменение к юниту «{unit.title}» и опубликует ваш форк.
              Оригинальному автору пойдёт {revShare}% от вашего дохода + единоразовый платёж по лицензии.
            </p>
          </header>

          {step === 'compose' && (
            <>
              <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                {/* Single instruction field */}
                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Инструкция LLM</label>
                  <div className="mt-1 relative">
                    <textarea
                      value={instruction}
                      onChange={(e) => setInstruction(e.target.value)}
                      className="w-full h-28 rounded-lg bg-background border border-card-border px-3 py-2 pr-10 text-sm"
                      placeholder="«Сделай такое же, только для моей компании. Замени биржу на OKX. Переведи на русский.»"
                      data-testid="textarea-instruction"
                      autoFocus
                    />
                    <button
                      className="absolute right-2 top-2 w-7 h-7 rounded-full bg-card border border-card-border flex items-center justify-center text-xs hover:border-primary/50"
                      title="Voice input (mock)"
                      data-testid="button-voice"
                      onClick={() => toast({ title: '🎙 Voice', description: 'Mock — speech-to-text would feed the same field.' })}
                    >
                      🎙
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {QUICK_PROMPTS.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => setInstruction(q)}
                        className="text-[10px] font-mono px-2 py-1 rounded-full bg-background border border-card-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        data-testid={`quick-prompt-${i}`}
                      >
                        + {q.slice(0, 38)}{q.length > 38 ? '…' : ''}
                      </button>
                    ))}
                  </div>
                </div>

                {/* My data injection */}
                <div className="rounded-lg bg-background/40 border border-card-border p-3">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useMyData}
                      onChange={(e) => setUseMyData(e.target.checked)}
                      className="mt-0.5"
                      data-testid="checkbox-use-my-data"
                    />
                    <div className="flex-1 text-xs">
                      <div className="font-medium text-foreground">Подтянуть мои данные автоматически</div>
                      <div className="text-muted-foreground mt-0.5 font-mono text-[10px] space-y-0.5">
                        <div>@{MY_PROFILE.handle} · {MY_PROFILE.company} · VAT {MY_PROFILE.vatId}</div>
                        <div>brand: {MY_PROFILE.brandColors.join(' / ')}</div>
                        <div>mcp: {MY_PROFILE.defaultMcp.join(', ')}</div>
                        <div>llm-keys: {MY_PROFILE.llmKeys.length} подключено</div>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Parent context (collapsed) */}
                <details className="rounded-lg bg-background/40 border border-card-border p-2.5">
                  <summary className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground cursor-pointer">
                    git context · parent {unit.branch}@{unit.commitHash}
                  </summary>
                  <div className="font-mono text-[11px] leading-relaxed mt-2 text-muted-foreground">
                    <div>$ git checkout -b respin/{unit.commitHash.slice(0,6)}-{MY_PROFILE.handle.split('.')[0]}</div>
                    <div>generation: {unit.generation} → {unit.generation + 1}</div>
                    <div>commit target: Base L2 + IPFS, royalty edge to ancestry</div>
                    <div>route: hot (Claude Haiku) for diff, cold (Bittensor) for regen if cost-bound</div>
                  </div>
                </details>

                {/* License for the spin */}
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">Лицензия моего форка</div>
                  <div className="grid grid-cols-2 gap-2">
                    {(['free', 'micro-paid', 'patronage', 'proprietary'] as LicenseKind[]).map(k => (
                      <button
                        key={k}
                        onClick={() => setLicense(k)}
                        data-testid={`license-${k}`}
                        className={`rounded-lg border px-3 py-2 text-sm text-left ${
                          license === k ? 'border-primary bg-primary/10 text-primary' : 'border-card-border text-foreground/70 hover:border-foreground/40'
                        }`}
                      >
                        {licenseLabel(k)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment row */}
                <div className={`rounded-lg p-3 text-xs space-y-1 border ${isPaid ? 'bg-amber-500/5 border-amber-500/30' : 'bg-background border-card-border'}`}>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Платёж автору сейчас</span>
                    <span className="font-mono">{isPaid ? `$${paidPrice.toFixed(2)}` : 'free'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Будущая доля от моего дохода</span>
                    <span className="font-mono">{revShare}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Запись в реестр (mock)</span>
                    <span className="font-mono">~0.0001 SOL</span>
                  </div>
                </div>
              </div>

              <footer className="px-5 py-3 border-t border-card-border flex items-center justify-between bg-background/50">
                <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground" data-testid="button-cancel-respin">Отмена</button>
                <button
                  disabled={!instruction.trim()}
                  onClick={() => setStep('preview')}
                  className="rounded-full bg-primary text-primary-foreground px-5 py-2 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed"
                  data-testid="button-preview"
                >
                  Превью →
                </button>
              </footer>
            </>
          )}

          {step === 'preview' && previewDiff && (
            <>
              <div className="px-5 py-4 space-y-3 max-h-[60vh] overflow-y-auto">
                <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">LLM diff (предпросмотр)</div>
                <pre className="rounded-lg bg-background border border-card-border p-3 text-[11px] font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap" data-testid="preview-diff">{previewDiff}</pre>
                <div className="text-[10px] text-muted-foreground font-mono">
                  P95 LLM latency: ~620ms (Claude Haiku 4.5) · сгенерировано из вашей инструкции и данных профиля.
                </div>
                {isPaid && (
                  <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-xs">
                    Подтверждая, вы автоматически переводите <b>${paidPrice.toFixed(2)}</b> автору @{unit.author.handle} и обязуетесь делить {revShare}% будущего дохода.
                  </div>
                )}
              </div>
              <footer className="px-5 py-3 border-t border-card-border flex items-center justify-between bg-background/50">
                <button onClick={() => setStep('compose')} className="text-sm text-muted-foreground hover:text-foreground" data-testid="button-back-compose">← Изменить</button>
                <button
                  onClick={() => {
                    setStep('published');
                    toast({
                      title: '↺ Respin опубликован',
                      description: `Поколение ${unit.generation + 1} · ${isPaid ? `списано $${paidPrice.toFixed(2)} · ` : ''}автор зачислен.`,
                    });
                  }}
                  className="rounded-full bg-primary text-primary-foreground px-5 py-2 text-sm font-medium"
                  data-testid="button-publish-respin"
                >
                  {isPaid ? `Заплатить $${paidPrice.toFixed(2)} и опубликовать` : 'Опубликовать форк'}
                </button>
              </footer>
            </>
          )}

          {step === 'published' && (
            <div className="px-5 py-8 text-center space-y-3">
              <div className="text-4xl">✦</div>
              <div className="font-display text-lg">Опубликовано</div>
              <div className="text-sm text-muted-foreground">
                Ваш форк — поколение {unit.generation + 1}, записан в реестр.<br/>
                Оригинальный автор автоматически зачислен.
              </div>
              <button onClick={onClose} className="mt-3 rounded-full bg-primary text-primary-foreground px-5 py-2 text-sm font-medium" data-testid="button-done">Готово</button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Mock LLM diff generator — deterministic preview based on instruction tokens.
// ────────────────────────────────────────────────────────────────────────────
function generateMockDiff(unit: UnitManifest, instruction: string, profile: typeof MY_PROFILE | null): string {
  const lines: string[] = [];
  lines.push(`--- a/${unit.id}.manifest.json`);
  lines.push(`+++ b/${unit.id}-respin.manifest.json`);
  lines.push(`@@ unit "${unit.title}" @@`);
  const lower = instruction.toLowerCase();

  if (profile) {
    lines.push(`+ author.handle: "${profile.handle}"`);
    lines.push(`+ context.company: "${profile.company}"`);
    lines.push(`+ context.vatId: "${profile.vatId}"`);
    if (unit.kind === 'commerce' || lower.includes('бренд') || lower.includes('brand')) {
      lines.push(`+ theme.colors: ["${profile.brandColors[0]}", "${profile.brandColors[1]}"]`);
    }
    if (lower.includes('моей компании') || lower.includes('my company') || lower.includes('компани')) {
      lines.push(`+ payload.recipient: "${profile.company}"`);
      lines.push(`+ mcp: [..., "${profile.defaultMcp[0]}"]`);
    }
  }

  if (lower.includes('okx')) {
    lines.push(`- mcp: ["mcp://exchange/binance"]`);
    lines.push(`+ mcp: ["mcp://exchange/okx"]`);
  }
  if (lower.includes('русск') || lower.includes('russian')) {
    lines.push(`+ locale: "ru-RU"`);
    lines.push(`+ promptTemplate: "${(unit.promptTemplate ?? '').slice(0, 40)}…" → переведён на русский`);
  }
  if (lower.includes('темн') || lower.includes('dark')) {
    lines.push(`+ theme: "tak-tak/dark-compact"`);
  }
  if (lower.includes('мобильн') || lower.includes('mobile')) {
    lines.push(`+ layout.density: "compact-mobile"`);
  }
  if (lower.includes('альтсезон') || lower.includes('altseason')) {
    lines.push(`+ filters.altseason: true`);
    lines.push(`+ payload.threshold.btcDominance: 0.48`);
  }
  if (lines.length === 4) {
    // No keyword match — generic placeholder
    lines.push(`+ note: "${instruction.slice(0, 80)}${instruction.length > 80 ? '…' : ''}"`);
    lines.push(`+ payload.modified: true`);
  }
  lines.push(``);
  lines.push(`Files changed: 1 manifest, ~${Math.max(3, Math.min(20, instruction.length / 8 | 0))} payload fields`);
  lines.push(`Royalty edge → ${unit.author.handle} @ ${(unit.license.revenueShareBps ?? 0) / 100}%`);
  return lines.join('\n');
}
