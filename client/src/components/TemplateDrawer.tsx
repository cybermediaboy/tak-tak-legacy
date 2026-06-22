// TemplateDrawer: показывает bundle-шаблон спейса (Linux-style git-узел).
// Layout, environment, modules, economics, default stack, moderation.
// Кнопки: Pull upstream (если есть обновления), Fork template, Pin commit.

import { motion, AnimatePresence } from 'framer-motion';
import { templatesById, engineModules, type Space, type SpaceTemplate } from '@/lib/taktak-data';
import { useToast } from '@/hooks/use-toast';

interface Props {
  space: Space;
  onClose: () => void;
}

export function TemplateDrawer({ space, onClose }: Props) {
  const tmpl = templatesById[space.templateId];
  const { toast } = useToast();

  if (!tmpl) return null;

  const onPull = () => {
    toast({
      title: '⇡ Pulling upstream',
      description: `Fast-forward ${space.templateUpdatesAvailable} commits into ${tmpl.handle}`,
    });
    onClose();
  };
  const onFork = () => {
    toast({
      title: '⌥ Template forked',
      description: `Created my-${tmpl.handle.split('.')[0]}.template at HEAD ${tmpl.commitHash}`,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center"
        onClick={onClose}
        data-testid="template-drawer"
      >
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          className="bg-card border border-card-border rounded-t-3xl sm:rounded-3xl max-w-2xl w-full max-h-[88vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <header className="sticky top-0 z-10 px-6 py-4 border-b border-card-border bg-card/95 backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  <span className="text-primary">⦾</span> SPACE TEMPLATE
                  <span className="text-foreground/40">·</span>
                  <span>{tmpl.moderation.curatorRole.toUpperCase()}</span>
                </div>
                <h2 className="font-display text-xl mt-1 truncate">{tmpl.name}</h2>
                <div className="text-xs text-muted-foreground font-mono mt-1 truncate">
                  {tmpl.handle} · v{tmpl.version} · {tmpl.branch}@{tmpl.commitHash}
                </div>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 w-8 h-8 rounded-full bg-muted/30 hover:bg-muted text-muted-foreground flex items-center justify-center"
                data-testid="close-template"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{tmpl.description}</p>
          </header>

          {/* Body */}
          <div className="px-6 py-4 space-y-4 text-sm">
            <Block label="Layout / UX">
              <KV k="swipe mode" v={tmpl.layout.swipe} />
              <KV k="allowed unit kinds" v={tmpl.layout.allowedKinds.join(' · ')} />
              <KV k="theme" v={tmpl.layout.theme} />
            </Block>

            <Block label="Environment">
              <KV k="runtimes" v={tmpl.environment.runtimes.join(', ')} />
              <KV k="cpu budget" v={`${tmpl.environment.resourceLimits.cpuMs} ms / unit`} />
              <KV k="memory" v={`${tmpl.environment.resourceLimits.memMB} MB`} />
            </Block>

            <Block label="Engine modules (pinned)">
              <KV k="feed algorithm" v={tmpl.modules.feedAlgorithm} mono />
              <KV k="sandbox" v={tmpl.modules.sandbox} mono />
              <KV k="identity" v={tmpl.modules.identity} mono />
            </Block>

            <Block label="Economics">
              <KV k="allowed licenses" v={tmpl.economics.allowedLicenses.join(' · ')} />
              <KV k="default revenue share" v={`${(tmpl.economics.defaultRevenueShareBps / 100).toFixed(1)}% to ancestry`} />
              <KV k="currency" v={tmpl.economics.currency} />
              <KV k="escrow policy" v={tmpl.economics.escrowPolicy} />
              {tmpl.economics.spinPriceRange && (
                <KV k="spin price range" v={`$${tmpl.economics.spinPriceRange[0].toFixed(2)} – $${tmpl.economics.spinPriceRange[1].toFixed(2)}`} />
              )}
            </Block>

            <Block label="Default stack">
              <KV k="MCP whitelist" v={tmpl.stack.mcpWhitelist.join(' · ')} mono />
              <KV k="LLM default" v={tmpl.stack.llmDefault} mono />
              {tmpl.stack.llmFallback && <KV k="LLM fallback" v={tmpl.stack.llmFallback} mono />}
            </Block>

            <Block label="Moderation">
              <KV k="curator role" v={tmpl.moderation.curatorRole} />
              <KV k="min author reputation" v={String(tmpl.moderation.minAuthorReputation)} />
              <KV k="cherry threshold" v={String(tmpl.moderation.cherryThreshold)} />
            </Block>

            <Block label="Ancestry">
              <KV
                k="parent template"
                v={tmpl.parentTemplateId ? templatesById[tmpl.parentTemplateId]?.handle ?? tmpl.parentTemplateId : '— root —'}
                mono
              />
              <KV k="forks downstream" v={`${tmpl.forks}`} />
              <KV k="open PRs upstream" v={`${tmpl.openPRs}`} />
              <KV k="registry hash" v={tmpl.registryHash} mono />
            </Block>

            {/* This space's pin */}
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
              <div className="text-[10px] font-mono uppercase tracking-wider text-primary mb-1.5">
                {space.name} pinned at
              </div>
              <div className="font-mono text-xs">
                {tmpl.handle} @{space.templatePin}
              </div>
              {space.templateUpdatesAvailable > 0 ? (
                <div className="text-xs text-amber-300 mt-2 font-mono">
                  ↑ {space.templateUpdatesAvailable} upstream commits available
                </div>
              ) : (
                <div className="text-xs text-muted-foreground mt-2 font-mono">up to date</div>
              )}
            </div>
          </div>

          {/* Actions */}
          <footer className="sticky bottom-0 px-6 py-4 border-t border-card-border bg-card/95 backdrop-blur flex flex-col sm:flex-row gap-2">
            <button
              disabled={space.templateUpdatesAvailable === 0}
              onClick={onPull}
              data-testid="template-pull"
              className="flex-1 rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ⇡ Pull upstream
            </button>
            <button
              onClick={onFork}
              data-testid="template-fork"
              className="flex-1 rounded-xl border border-card-border bg-card hover:bg-muted/30 py-2.5 text-sm font-medium"
            >
              ⌥ Fork this template
            </button>
          </footer>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">{label}</div>
      <div className="rounded-2xl border border-card-border bg-background/40 p-3 space-y-1">{children}</div>
    </section>
  );
}

function KV({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 text-xs">
      <span className="text-muted-foreground">{k}</span>
      <span className={mono ? 'font-mono break-all' : 'break-words'}>{v}</span>
    </div>
  );
}

// Engine catalog footer (used elsewhere if needed)
export function engineSummary() {
  return engineModules.map((m) => `${m.name}@${m.version}`).join(', ');
}
