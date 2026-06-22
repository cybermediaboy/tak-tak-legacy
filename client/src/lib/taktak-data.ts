// Tak-Tak: demo data model
// Each "Unit" is a self-contained mini-app: prompt + env + content + license + payment
// Spaces are channels grouping units. Users swipe horizontally between spaces,
// vertically through units within a space.

export type UnitKind =
  | 'content'        // article, image, video, story
  | 'tool'           // mini calculator, converter, generator
  | 'commerce'       // product card, micro-purchase
  | 'interactive'    // poll, quiz, game, AR
  | 'data'           // chart, dashboard widget
  | 'agent'          // AI agent you can chat with
  | 'pass';          // patronage / revenue-share subscription pass with physical-card tier thumbnails

export type LicenseKind = 'free' | 'micro-paid' | 'patronage' | 'proprietary';

export interface Author {
  id: string;
  handle: string;
  name: string;
  avatar: string;       // emoji or initials for MVP
  reputation: number;   // 0..100
  verified?: boolean;
  forHire?: boolean;    // available for freelance — author shows a guild badge on avatar
  guild?: string;       // freelance guild handle, e.g. 'agents-guild' or 'slow-makers'
}

export type RoutePolicy = 'hot' | 'cold' | 'hybrid';
// hot   = managed low-latency provider (Claude Haiku / Gemini Flash) for interactive critical path
// cold  = community node (Bittensor / Akash) for batch / regen / training
// hybrid = first token from hot, rest streamed from cold (cost-optimised)

export interface UnitManifest {
  id: string;
  kind: UnitKind;
  title: string;
  subtitle?: string;
  author: Author;
  spaceId: string;
  // Container metadata
  env: string[];              // e.g. ['node:20', 'python:3.11']
  mcp: string[];              // e.g. ['mcp://maps', 'mcp://finance']
  llm?: string;               // e.g. 'community:llama-3.1-70b' or 'openai:gpt-4o'
  routePolicy?: RoutePolicy;  // hot | cold | hybrid — protects critical-path UX
  promptTemplate?: string;    // editable on respin
  // Content payload (rendered by kind)
  payload: Record<string, unknown>;
  // Author-level customisation (within template's whitelist)
  overlay?: AuthorOverlay;
  // Hyperlinks to other units — unit-graph navigation
  links?: Array<{ targetUnitId: string; label: string; kind: 'reference' | 'parent' | 'remix-of' | 'dependency' }>;
  // Commerce / licensing
  license: {
    kind: LicenseKind;
    spinPrice?: number;       // USD, micro-payment for respin
    revenueShareBps?: number; // basis points (100 = 1%) sent back to original author chain
    // Crawler / AI-training defence. Default for every unit is 'deny'.
    // Authors can opt-in by switching to 'allow' or 'opt-in-only' (per-crawler allowlist).
    aiTraining?: 'deny' | 'allow' | 'opt-in-only';
  };
  // Reputation signals
  stats: {
    views: number;
    spins: number;
    cherries: number;         // 🍒 = "already good, pick it up"
    givers: number;           // patronage backers
  };
  // Origin classification — colour-coded corner marker on the post card.
  // handmade   = built from scratch by the author (no parent, no LLM prompt)
  // respinned  = derived from another post (has parentId / generation > 0)
  // freelanced = produced by a hired professional from a guild
  origin: 'handmade' | 'respinned' | 'freelanced';
  // What the embedded application does — single short line shown next to the unified app icon.
  appDescription?: string;
  // Ancestry (Spin = fork). Each unit = node in an on-chain commit DAG.
  parentId?: string;
  generation: number;         // 0 = original, 1+ = respin depth
  branch: string;             // e.g. 'main', 'experimental-binance-v3'
  commitHash: string;         // short hash of THIS commit
  parentHashes?: string[];    // for merges and cherry-picks (multi-parent)
  forks: number;              // active downstream spins
  openPRs: number;            // upstream-respin pull-requests waiting
  // Trust hash (would be on chain in production)
  registryHash: string;
  createdAt: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Engine + Space Templates (community git-DAG, Linux-style)
// ──────────────────────────────────────────────────────────────────────────────

export interface EngineModule {
  id: string;
  name: string;             // e.g. 'feed/for-you-ranker'
  version: string;          // semver
  branch: string;           // e.g. 'main'
  commitHash: string;
  maintainers: string[];    // author ids — minimum 2 required for merge rights
  openPRs: number;
  forks: number;
  ltsTag?: string;          // LTS version pinned by templates (e.g. 'lts/0.7.x')
}

// Engine-level governance: Mozilla/Chromium hybrid — open contribute, governed merge.
export interface EngineGovernance {
  model: 'open-core';
  bdfl: string;               // author id
  council: string[];          // author ids, must include >= 2 independent maintainers
  pipProcess: string;         // Pluralised Improvement Proposal — public RFC URL
  ltsCadence: string;         // e.g. '6 months'
  majorVoteThresholdBps: number;  // basis points of on-chain votes for major bump
  forkPolicy: string;         // 'free / signal-only — no kernel takeover possible'
}

export const engineGovernance: EngineGovernance = {
  model: 'open-core',
  bdfl: 'a0',
  council: ['a0', 'a1', 'a3'],
  pipProcess: 'https://github.com/taktak/PIPs',
  ltsCadence: '6 months',
  majorVoteThresholdBps: 6600,  // 66% of staked reputation
  forkPolicy: 'Anyone can fork engine + take community with them; protocol IDs preserved across forks.',
};

export type SwipeMode = '2d-mesh' | 'vertical-only' | 'grid' | 'thread' | 'dashboard' | 'map';

// Functionality button — semantic "do-action" defined by template, NOT by author.
// Author chooses subset / re-labels within shell limits. Action wired to MCP call or local handler.
export interface TemplateFnButton {
  id: string;                  // stable id, e.g. 'backtest', 'buy', 'ask-agent'
  defaultLabel: string;        // template-provided default copy
  icon?: string;               // single emoji or short symbol
  action: string;              // 'mcp://...' or 'local#handler'
  category: 'primary' | 'secondary' | 'utility';
}

// Visual shell of every unit in a space — fixed by template, cannot be overridden.
// CONTENT-FIRST: payload renders full-width. Functionality lives in a separate rail BELOW content.
export interface TemplateShell {
  cardRadius: number;            // px
  cardPadding: number;           // px
  headerSlot: 'author-license' | 'minimal' | 'brand-band';
  footerSlot: 'stats-git' | 'minimal' | 'commerce-buy';
  actionRail: 'standard' | 'compact' | 'thread-reply';   // side rail (respin/cherry/give/react)
  // Functionality rail under content: template defines the menu of "do-actions" allowed in this space.
  fnRail: {
    position: 'below-content' | 'overlay-bottom' | 'embedded-inline';
    style: 'pills' | 'icons' | 'list';
    whitelist: TemplateFnButton[];   // FULL menu the template permits
    defaultSelection: string[];      // fn-button ids shown by default when author doesn't override
    maxAuthorPicks: number;          // upper bound on how many fn-buttons a unit may show
  };
  paletteVars: Record<string, string>;  // CSS vars whitelist (--accent, --bg-soft, etc)
  cssVarsWhitelist: string[];           // which vars author overlay MAY override
}

// Per-unit author overlay — lives WITHIN template shell, bounded by template whitelist.
export interface AuthorOverlay {
  cssVars?: Record<string, string>;     // must be subset of template.cssVarsWhitelist
  payloadRenderer?: 'default' | 'custom-wasm' | 'rich-html';
  // Author's selection from template.fnRail.whitelist — each entry can pin or re-label.
  // Order = display order. Length must be <= template.fnRail.maxAuthorPicks.
  fnButtons?: Array<{
    id: string;                         // must be in template.fnRail.whitelist[].id
    labelOverride?: string;             // optional re-label within ~24 chars
  }>;
  extraMcp?: string[];                  // must intersect template.stack.mcpWhitelist
}

export interface SpaceTemplate {
  id: string;
  handle: string;            // e.g. 'quant-lab.template'
  name: string;
  description: string;
  version: string;           // semver
  branch: string;
  commitHash: string;
  parentTemplateId?: string; // fork of which template
  forks: number;
  openPRs: number;
  // Layout / UX
  layout: { swipe: SwipeMode; allowedKinds: UnitKind[]; theme: string };
  // Visual shell every unit in this space inherits
  shell: TemplateShell;
  // Environment
  environment: { runtimes: string[]; resourceLimits: { cpuMs: number; memMB: number } };
  // Functionality — module pins
  modules: { feedAlgorithm: string; sandbox: string; identity: string };
  // Economics
  economics: {
    allowedLicenses: LicenseKind[];
    defaultRevenueShareBps: number;
    currency: 'USD' | 'USDC' | 'ETH';
    escrowPolicy: 'none' | 'on-spin' | 'on-ship';
    spinPriceRange?: [number, number];
  };
  // Default stack
  stack: {
    mcpWhitelist: string[];
    llmDefault: string;
    llmFallback?: string;
  };
  // Moderation
  moderation: { minAuthorReputation: number; cherryThreshold: number; curatorRole: 'BDFL' | 'council' | 'open' };
  registryHash: string;
  createdAt: string;
}

export interface Space {
  id: string;
  handle: string;
  name: string;
  description: string;
  cover: string;        // gradient stops "from:to"
  icon: string;         // emoji
  subscribers: number;
  curator: Author;
  // Git-based: which template this space pinned, and at which commit
  templateId: string;
  templatePin: string;  // commit hash this space is locked to
  templateUpdatesAvailable: number; // upstream commits since pin
}

// ──────────────────────────────────────────────────────────────────────────────
// Demo authors
// ──────────────────────────────────────────────────────────────────────────────

const authors: Record<string, Author> = {
  nadia: { id: 'a1', handle: 'nadia.tt', name: 'Nadia K.', avatar: '🌙', reputation: 87, verified: true, forHire: true, guild: 'slow-makers' },
  ivan:  { id: 'a2', handle: 'ivan.builds', name: 'Ivan P.', avatar: '🛠', reputation: 72, forHire: true, guild: 'pocket-builders' },
  liu:   { id: 'a3', handle: 'liu.market', name: 'Liu Wei', avatar: '🌿', reputation: 91, verified: true },
  oren:  { id: 'a4', handle: 'oren.agent', name: 'Oren A.', avatar: '🦊', reputation: 64, forHire: true, guild: 'agents-guild' },
  zara:  { id: 'a5', handle: 'zara.art', name: 'Zara M.', avatar: '🎴', reputation: 79 },
  // Brick-and-mortar coffee shop in Nicosia. forHire = available for catering / consult.
  costa: { id: 'a6', handle: 'phaedras.coffee', name: 'Phaedra’s Coffee', avatar: '☕', reputation: 83, verified: true, forHire: true, guild: 'slow-makers' },
  community: { id: 'a0', handle: 'community', name: 'Tak-Tak Community', avatar: '✦', reputation: 100, verified: true },
};

// ──────────────────────────────────────────────────────────────────────────────
// Spaces (horizontal swipe rails)
// ──────────────────────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────────────────────
// Engine modules (canonical core, Linux-style governance)
// ──────────────────────────────────────────────────────────────────────────────

export const engineModules: EngineModule[] = [
  { id: 'm1', name: 'engine/core',              version: '0.7.2', branch: 'main', commitHash: '7f3a91c', maintainers: ['a0','a1'], openPRs: 12, forks: 84, ltsTag: 'lts/0.7.x' },
  { id: 'm2', name: 'engine/feed/for-you',      version: '0.4.1', branch: 'main', commitHash: '2c8e4d0', maintainers: ['a0','a4'], openPRs:  7, forks: 41, ltsTag: 'lts/0.4.x' },
  { id: 'm3', name: 'engine/sandbox/wasm',      version: '0.3.0', branch: 'main', commitHash: 'b1402af', maintainers: ['a0','a2'], openPRs:  4, forks: 23, ltsTag: 'lts/0.3.x' },
  { id: 'm4', name: 'engine/registry/base',     version: '1.0.0', branch: 'main', commitHash: 'e09f1b5', maintainers: ['a0','a3'], openPRs:  2, forks:  9, ltsTag: 'lts/1.0.x' },
  { id: 'm5', name: 'engine/llm-router',        version: '0.5.3', branch: 'main', commitHash: '5a7d20e', maintainers: ['a0','a4'], openPRs:  9, forks: 31, ltsTag: 'lts/0.5.x' },
  { id: 'm6', name: 'engine/mcp/binance',       version: '0.2.0', branch: 'main', commitHash: '11f0e2b', maintainers: ['a1','a3'], openPRs:  3, forks: 15 },
];

// ──────────────────────────────────────────────────────────────────────────────
// Space templates (community-forkable bundles)
// ──────────────────────────────────────────────────────────────────────────────

export const templates: SpaceTemplate[] = [
  {
    id: 't1', handle: 'mesh-base.template', name: 'Mesh Base',
    description: 'Default 2D-mesh feed. Permissive licenses, community LLM.',
    version: '1.2.0', branch: 'main', commitHash: 'a91c4f2', forks: 184, openPRs: 14,
    layout: { swipe: '2d-mesh', allowedKinds: ['content','tool','interactive','data','agent','commerce'], theme: 'tak-tak/dark' },
    shell: {
      cardRadius: 18, cardPadding: 16,
      headerSlot: 'author-license', footerSlot: 'stats-git', actionRail: 'standard',
      fnRail: {
        position: 'below-content', style: 'pills', maxAuthorPicks: 3,
        whitelist: [
          { id: 'open',    defaultLabel: 'Читать целиком', icon: '⤢', action: 'local#expandPayload', category: 'primary'   },
          { id: 'share',   defaultLabel: 'Поделиться',     icon: '↗', action: 'local#share',          category: 'secondary' },
          { id: 'save',    defaultLabel: 'Сохранить',      icon: '⤓', action: 'local#bookmark',       category: 'secondary' },
          { id: 'discuss', defaultLabel: 'Обсудить',       icon: '✎', action: 'local#openThread',     category: 'utility'   },
        ],
        defaultSelection: ['open','share','save'],
      },
      paletteVars: { '--accent': '#22D3EE', '--bg-soft': '#0F172A' },
      cssVarsWhitelist: ['--accent','--bg-soft','--text-muted'],
    },
    environment: { runtimes: ['node:20','python:3.11'], resourceLimits: { cpuMs: 5000, memMB: 256 } },
    modules: { feedAlgorithm: 'engine/feed/for-you@0.4.1', sandbox: 'engine/sandbox/wasm@0.3.0', identity: 'identity/passkey@1.0.0' },
    economics: { allowedLicenses: ['free','micro-paid','patronage'], defaultRevenueShareBps: 500, currency: 'USD', escrowPolicy: 'on-spin' },
    stack: { mcpWhitelist: ['mcp://news','mcp://maps','mcp://design/figma'], llmDefault: 'community:llama-3.1-70b', llmFallback: 'community:mistral-large' },
    moderation: { minAuthorReputation: 0, cherryThreshold: 50, curatorRole: 'open' },
    registryHash: '0xt1m3sh', createdAt: '2026-03-01T00:00:00Z',
  },
  {
    id: 't2', handle: 'quant-lab.template', name: 'Quant Lab',
    description: 'Vertical feed for charts/agents. Heavy compute. Patronage-default, Bittensor LLM.',
    version: '0.6.1', branch: 'main', commitHash: '4d72e08', parentTemplateId: 't1', forks: 47, openPRs: 8,
    layout: { swipe: 'vertical-only', allowedKinds: ['data','agent','tool','content'], theme: 'tak-tak/quant' },
    shell: {
      cardRadius: 12, cardPadding: 14,
      headerSlot: 'minimal', footerSlot: 'stats-git', actionRail: 'compact',
      fnRail: {
        position: 'below-content', style: 'pills', maxAuthorPicks: 4,
        whitelist: [
          { id: 'backtest',  defaultLabel: 'Backtest',         icon: '◦', action: 'mcp://exchange/binance#backtest', category: 'primary'   },
          { id: 'alert',     defaultLabel: 'Сделать алерт', icon: '△', action: 'local#createAlert',                category: 'primary'   },
          { id: 'csv',       defaultLabel: 'CSV',              icon: '⤓', action: 'local#exportCsv',                  category: 'secondary' },
          { id: 'pine',      defaultLabel: '→ Pine',           icon: '§', action: 'local#exportPine',                 category: 'secondary' },
          { id: 'sources',   defaultLabel: 'Источники',       icon: '¶', action: 'local#showSources',                category: 'utility'   },
          { id: 'reproduce', defaultLabel: 'Воспроизвести',   icon: '↻', action: 'local#runNotebook',                category: 'utility'   },
        ],
        defaultSelection: ['backtest','alert','csv','sources'],
      },
      paletteVars: { '--accent': '#22D3EE', '--bg-soft': '#0B1220', '--grid-line': '#1E293B' },
      cssVarsWhitelist: ['--accent','--bg-soft','--grid-line'],
    },
    environment: { runtimes: ['python:3.11','node:20'], resourceLimits: { cpuMs: 20000, memMB: 1024 } },
    modules: { feedAlgorithm: 'engine/feed/recency-weighted@0.2.0', sandbox: 'engine/sandbox/wasm@0.3.0', identity: 'identity/siwe@1.0.0' },
    economics: { allowedLicenses: ['micro-paid','patronage'], defaultRevenueShareBps: 1000, currency: 'USDC', escrowPolicy: 'on-spin', spinPriceRange: [0.10, 5.00] },
    stack: { mcpWhitelist: ['mcp://exchange/binance','mcp://onchain/etherscan','mcp://news'], llmDefault: 'bittensor:subnet-9', llmFallback: 'community:llama-3.1-70b' },
    moderation: { minAuthorReputation: 40, cherryThreshold: 200, curatorRole: 'council' },
    registryHash: '0xt2qnt', createdAt: '2026-04-12T00:00:00Z',
  },
  {
    id: 't3', handle: 'pocket-tools.template', name: 'Pocket Tools',
    description: 'Single-tap utilities. Strict resource budget. Free-tier default.',
    version: '0.8.4', branch: 'main', commitHash: 'c5e1a89', parentTemplateId: 't1', forks: 96, openPRs: 5,
    layout: { swipe: 'vertical-only', allowedKinds: ['tool','interactive'], theme: 'tak-tak/utility' },
    shell: {
      cardRadius: 22, cardPadding: 18,
      headerSlot: 'minimal', footerSlot: 'minimal', actionRail: 'compact',
      fnRail: {
        position: 'below-content', style: 'pills', maxAuthorPicks: 3,
        whitelist: [
          { id: 'run',   defaultLabel: 'Запустить',  icon: '▶', action: 'local#runTool',    category: 'primary'   },
          { id: 'copy',  defaultLabel: 'Скопировать', icon: '⎘', action: 'local#copyResult', category: 'secondary' },
          { id: 'reset', defaultLabel: 'Сброс',     icon: '↻', action: 'local#reset',      category: 'utility'   },
          { id: 'docs',  defaultLabel: 'Как работает', icon: '?', action: 'local#showDocs',  category: 'utility'   },
        ],
        defaultSelection: ['run','copy','reset'],
      },
      paletteVars: { '--accent': '#34D399', '--bg-soft': '#0F172A' },
      cssVarsWhitelist: ['--accent','--bg-soft'],
    },
    environment: { runtimes: ['node:20'], resourceLimits: { cpuMs: 2000, memMB: 128 } },
    modules: { feedAlgorithm: 'engine/feed/popular@0.3.0', sandbox: 'engine/sandbox/wasm@0.3.0', identity: 'identity/passkey@1.0.0' },
    economics: { allowedLicenses: ['free','micro-paid'], defaultRevenueShareBps: 300, currency: 'USD', escrowPolicy: 'on-spin', spinPriceRange: [0, 1.00] },
    stack: { mcpWhitelist: ['mcp://design/figma','mcp://maps'], llmDefault: 'community:llama-3.1-8b' },
    moderation: { minAuthorReputation: 20, cherryThreshold: 100, curatorRole: 'open' },
    registryHash: '0xt3tls', createdAt: '2026-03-22T00:00:00Z',
  },
  {
    id: 't4', handle: 'slow-market.template', name: 'Slow Market',
    description: 'Grid layout for hand-made commerce. Proprietary-default, escrow-on-ship.',
    version: '0.5.0', branch: 'main', commitHash: '9b0f4e2', parentTemplateId: 't1', forks: 28, openPRs: 3,
    layout: { swipe: 'grid', allowedKinds: ['commerce','content','pass'], theme: 'tak-tak/warm' },
    shell: {
      cardRadius: 8, cardPadding: 12,
      headerSlot: 'brand-band', footerSlot: 'commerce-buy', actionRail: 'standard',
      fnRail: {
        position: 'below-content', style: 'pills', maxAuthorPicks: 4,
        whitelist: [
          { id: 'buy',        defaultLabel: 'Купить',      icon: '¤', action: 'mcp://payments/stripe#checkout',   category: 'primary'   },
          { id: 'contact',    defaultLabel: 'Написать',   icon: '✉', action: 'local#openChat',                   category: 'primary'   },
          { id: 'related',    defaultLabel: 'Похожие',     icon: '☰', action: 'local#showRelated',                category: 'secondary' },
          { id: 'shipping',   defaultLabel: 'Доставка',    icon: '⛟', action: 'mcp://shipping/easypost#estimate', category: 'secondary' },
          { id: 'ar-preview', defaultLabel: 'Примерить AR', icon: '⦾', action: 'local#openAR',                     category: 'utility'   },
        ],
        defaultSelection: ['buy','contact','related','shipping'],
      },
      paletteVars: { '--accent': '#F59E0B', '--bg-soft': '#1C1410', '--brand-band': '#2A1B12' },
      cssVarsWhitelist: ['--accent','--bg-soft','--brand-band','--brand-logo-url'],
    },
    environment: { runtimes: ['node:20'], resourceLimits: { cpuMs: 3000, memMB: 256 } },
    modules: { feedAlgorithm: 'engine/feed/local-first@0.1.0', sandbox: 'engine/sandbox/wasm@0.3.0', identity: 'identity/passkey@1.0.0' },
    economics: { allowedLicenses: ['proprietary','micro-paid','patronage'], defaultRevenueShareBps: 0, currency: 'USD', escrowPolicy: 'on-ship' },
    stack: { mcpWhitelist: ['mcp://payments/stripe','mcp://shipping/easypost'], llmDefault: 'community:llama-3.1-8b' },
    moderation: { minAuthorReputation: 60, cherryThreshold: 30, curatorRole: 'BDFL' },
    registryHash: '0xt4mkt', createdAt: '2026-04-30T00:00:00Z',
  },
  {
    id: 't5', handle: 'agents-guild.template', name: 'Agents Guild',
    description: 'Thread-style chat agents. Pay-per-query micro-paid, Bittensor + Akash fallback.',
    version: '0.3.1', branch: 'main', commitHash: '6e74a13', parentTemplateId: 't2', forks: 19, openPRs: 6,
    layout: { swipe: 'thread', allowedKinds: ['agent','tool','data'], theme: 'tak-tak/agents' },
    shell: {
      cardRadius: 14, cardPadding: 14,
      headerSlot: 'author-license', footerSlot: 'stats-git', actionRail: 'thread-reply',
      fnRail: {
        position: 'below-content', style: 'pills', maxAuthorPicks: 4,
        whitelist: [
          { id: 'ask',     defaultLabel: 'Спросить',  icon: '➜', action: 'local#askAgent',     category: 'primary'   },
          { id: 'attach',  defaultLabel: 'Прикрепить', icon: '⧉', action: 'local#attachFile',   category: 'secondary' },
          { id: 'export',  defaultLabel: 'Экспорт',     icon: '⤓', action: 'local#exportDiff',   category: 'secondary' },
          { id: 'history', defaultLabel: 'История',    icon: '↻', action: 'local#showHistory',  category: 'utility'   },
          { id: 'compare', defaultLabel: 'Сравнить',   icon: '⧄', action: 'local#compareAgents',category: 'utility'   },
        ],
        defaultSelection: ['ask','attach','export'],
      },
      paletteVars: { '--accent': '#A78BFA', '--bg-soft': '#120B1F' },
      cssVarsWhitelist: ['--accent','--bg-soft'],
    },
    environment: { runtimes: ['python:3.11','node:20'], resourceLimits: { cpuMs: 30000, memMB: 2048 } },
    modules: { feedAlgorithm: 'engine/feed/reputation-ranked@0.2.0', sandbox: 'engine/sandbox/wasm@0.3.0', identity: 'identity/siwe@1.0.0' },
    economics: { allowedLicenses: ['micro-paid','patronage'], defaultRevenueShareBps: 1500, currency: 'USDC', escrowPolicy: 'on-spin', spinPriceRange: [0.20, 10.00] },
    stack: { mcpWhitelist: ['mcp://tv/pine-guard','mcp://news','mcp://exchange/binance'], llmDefault: 'bittensor:subnet-9', llmFallback: 'akash:gpu-pool-3' },
    moderation: { minAuthorReputation: 50, cherryThreshold: 150, curatorRole: 'council' },
    registryHash: '0xt5agt', createdAt: '2026-05-15T00:00:00Z',
  },
];

export const templatesById: Record<string, SpaceTemplate> = templates.reduce((acc, t) => { acc[t.id] = t; return acc; }, {} as Record<string, SpaceTemplate>);

export const spaces: Space[] = [
  {
    id: 's1', handle: 'for-you', name: 'For You',
    description: 'Filter-view: personalized cross-channel mix. Units live in their native channels — this is a selection, not a channel.',
    cover: 'from-cyan-500/40 to-amber-500/30', icon: '✦',
    subscribers: 1_842_000, curator: authors.community,
    templateId: 't1', templatePin: 'a91c4f2', templateUpdatesAvailable: 0,
  },
  {
    id: 's2', handle: 'quant', name: 'Quant Lab',
    description: 'Trading ideas, microstructure, ML alpha. Respin to backtest your own.',
    cover: 'from-cyan-500/40 to-blue-700/30', icon: '📈',
    subscribers: 38_400, curator: authors.nadia,
    templateId: 't2', templatePin: '4d72e08', templateUpdatesAvailable: 3,
  },
  {
    id: 's3', handle: 'tools', name: 'Pocket Tools',
    description: 'One-tap utilities. Respin to bind your own MCP and re-publish.',
    cover: 'from-emerald-500/40 to-cyan-500/30', icon: '⚙',
    subscribers: 121_000, curator: authors.ivan,
    templateId: 't3', templatePin: 'c5e1a89', templateUpdatesAvailable: 1,
  },
  {
    id: 's4', handle: 'market', name: 'Slow Market',
    description: 'Micro-shops by hand. Buy or hire the maker.',
    cover: 'from-amber-500/40 to-rose-500/30', icon: '🏺',
    subscribers: 64_200, curator: authors.liu,
    templateId: 't4', templatePin: '9b0f4e2', templateUpdatesAvailable: 0,
  },
  {
    id: 's5', handle: 'agents', name: 'Agents Guild',
    description: 'Specialist AI agents, locally hosted. Pay-per-task or patronage.',
    cover: 'from-purple-500/40 to-cyan-500/30', icon: '🦊',
    subscribers: 27_800, curator: authors.oren,
    templateId: 't5', templatePin: '6e74a13', templateUpdatesAvailable: 2,
  },
  {
    id: 's6', handle: 'local', name: 'Brick & Mortar',
    description: 'Local brick-and-mortar shops with online manifest. Hours, menu, location, loyalty.',
    cover: 'from-amber-400/40 to-rose-400/30', icon: '☕',
    subscribers: 18_300, curator: authors.liu,
    templateId: 't4', templatePin: 'f3e1c44', templateUpdatesAvailable: 0,
  },
  {
    id: 's7', handle: 'invest', name: 'Investment',
    description: 'Community capital: experts rate projects on Tak-Tak, users discuss thesis, decide whom to back via the Give button. No platform-managed ads, no sponsored picks.',
    cover: 'from-emerald-500/40 to-amber-400/30', icon: '💰',
    subscribers: 8_900, curator: authors.community,
    templateId: 't1', templatePin: 'a91c4f2', templateUpdatesAvailable: 0,
  },
  {
    id: 's8', handle: 'townhall', name: 'Town Hall',
    description: 'Community essays, polls, governance proposals. Engine-level signal.',
    cover: 'from-violet-500/40 to-cyan-500/30', icon: '⊕',
    subscribers: 92_700, curator: authors.community,
    templateId: 't1', templatePin: 'a91c4f2', templateUpdatesAvailable: 0,
  },
  {
    id: 's9', handle: 'local', name: 'Local',
    description: 'Filter-view: geo-bound selection. Same accounts appear here AND in their native channels (e.g. Brick & Mortar). Local is a lens, not a channel.',
    cover: 'from-orange-400/40 to-amber-500/30', icon: '📍',
    subscribers: 4_120, curator: authors.community,
    templateId: 't1', templatePin: 'a91c4f2', templateUpdatesAvailable: 0,
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// Units (vertical swipe inside a space)
// ──────────────────────────────────────────────────────────────────────────────

const mkHash = (i: number) => `0x${(i * 0xa1b2c3d4 >>> 0).toString(16).padStart(8, '0')}…${(i * 7).toString(16).slice(-4)}`;
const mkShort = (i: number) => ((i * 0xdeadbeef) >>> 0).toString(16).slice(0, 7);
let _i = 0;
const nextHash = () => mkHash(++_i);
const nextCommit = () => mkShort(_i);

export const units: UnitManifest[] = [
  // ── s2 · Quant Lab ─────────────────────────────────────────────────
  // Channel topic: trading / market-microstructure / quantitative research.
  // Every unit here must touch real market data (binance, etherscan, alpha).

  {
    id: 'u2', kind: 'tool', title: 'BTC/USDT order-book depth',
    subtitle: 'Live ladder · top-of-book imbalance · refresh on tap',
    author: authors.nadia, spaceId: 's2',
    env: ['node:20', 'python:3.11'], mcp: ['mcp://exchange/binance'], llm: 'community:llama-3.1-70b',
    routePolicy: 'hot',
    promptTemplate: 'Render an order-book depth widget for {pair}, refresh every {interval}s.',
    payload: { pair: 'BTCUSDT', bids: [[64210, 1.42], [64205, 3.10], [64200, 8.20], [64195, 4.30]], asks: [[64215, 0.98], [64220, 2.40], [64225, 5.60], [64230, 7.10]], imbalance: 0.18 },
    overlay: {
      cssVars: { '--accent': '#22D3EE' },
      fnButtons: [
        { id: 'backtest', labelOverride: 'Backtest сигнал' },
        { id: 'alert', labelOverride: 'Алерт на imbalance' },
        { id: 'csv' },
        { id: 'sources' },
      ],
    },
    links: [
      { targetUnitId: 'u4', label: 'Liquidity heatmap →', kind: 'dependency' },
      { targetUnitId: 'u14', label: 'On-chain screener →', kind: 'reference' },
    ],
    license: { kind: 'micro-paid', spinPrice: 0.50, revenueShareBps: 500 },
    stats: { views: 38_120, spins: 642, cherries: 1_812, givers: 28 },
    generation: 0, branch: 'experimental-binance-v3', commitHash: nextCommit(), forks: 642, openPRs: 11, registryHash: nextHash(),
    createdAt: '2026-06-19T11:20:00Z',
    origin: 'handmade', appDescription: 'Ордербук BTC/USDT в реальном времени',
  },
  {
    id: 'u4', kind: 'data', title: 'Liquidity heatmap · ETH perp',
    subtitle: 'Stop-clusters and sweeps · last 24h',
    author: authors.nadia, spaceId: 's2',
    env: ['python:3.11'], mcp: ['mcp://exchange/binance', 'mcp://onchain/etherscan'],
    routePolicy: 'hybrid',
    payload: { rows: [[ '+2σ', 0.2 ], [ '+1σ', 0.55 ], [ 'mid', 1.0 ], [ '-1σ', 0.62 ], [ '-2σ', 0.31 ]], sweepCount: 7 },
    overlay: {
      cssVars: { '--accent': '#22D3EE', '--grid-line': '#0EA5E9' },
      fnButtons: [
        { id: 'backtest' },
        { id: 'alert', labelOverride: 'Алерт на sweep' },
        { id: 'csv' },
        { id: 'sources' },
      ],
    },
    links: [
      { targetUnitId: 'u5', label: 'Передать в screener →', kind: 'dependency' },
      { targetUnitId: 'u2', label: '← Источник: order-book', kind: 'parent' },
    ],
    license: { kind: 'patronage', revenueShareBps: 1000 },
    stats: { views: 14_200, spins: 188, cherries: 740, givers: 41 },
    generation: 0, branch: 'main', commitHash: nextCommit(), forks: 188, openPRs: 3, registryHash: nextHash(),
    createdAt: '2026-06-19T18:00:00Z',
    origin: 'handmade', appDescription: 'Тепловая карта ликвидности ETH perp',
  },
  {
    id: 'u14', kind: 'agent', title: 'On-chain whale screener',
    subtitle: 'Расскажет, какие кошельки набирают позицию прямо сейчас',
    author: authors.oren, spaceId: 's2',
    env: ['python:3.11'], mcp: ['mcp://onchain/etherscan', 'mcp://exchange/binance'], llm: 'bittensor:subnet-9',
    routePolicy: 'hybrid',
    promptTemplate: 'Скан кошельков с балансом > {threshold}, изменение за {window}. Сравни с CEX-нетто.',
    payload: { lastReply: '0xA0b8…ed4: +1,840 ETH за 14h · netflow с Binance −820 ETH · 4 ассоциированных адреса.' },
    overlay: {
      fnButtons: [
        { id: 'ask', labelOverride: 'Спросить про адрес' },
        { id: 'attach' },
        { id: 'export' },
      ],
    },
    links: [{ targetUnitId: 'u4', label: 'Сопоставить с heatmap', kind: 'reference' }],
    license: { kind: 'micro-paid', spinPrice: 0.30, revenueShareBps: 800 },
    stats: { views: 5_120, spins: 187, cherries: 290, givers: 9 },
    generation: 0, branch: 'main', commitHash: nextCommit(), forks: 187, openPRs: 2, registryHash: nextHash(),
    createdAt: '2026-06-20T16:00:00Z',
    origin: 'freelanced', appDescription: 'Скан китов on-chain',
  },
  {
    id: 'u5', kind: 'agent', title: 'Mean-reversion screener',
    subtitle: 'Спросите setup — заплатите за вызов · отдаёт ranked список',
    author: authors.oren, spaceId: 's2',
    env: ['python:3.11'], mcp: ['mcp://exchange/binance', 'mcp://news'], llm: 'community:llama-3.1-70b',
    routePolicy: 'hot',
    promptTemplate: 'You are a mean-reversion screener. Inputs: {universe}, {lookback}. Output ranked list.',
    payload: { lastReply: 'SOL/USDT: z=−2.3, vol-of-vol expanding, no news catalyst. Tactical bid.' },
    license: { kind: 'micro-paid', spinPrice: 1.20, revenueShareBps: 700 },
    stats: { views: 6_900, spins: 207, cherries: 410, givers: 12 },
    generation: 0, branch: 'main', commitHash: nextCommit(), forks: 207, openPRs: 5, registryHash: nextHash(),
    createdAt: '2026-06-20T08:30:00Z',
    origin: 'freelanced', appDescription: 'Скринер mean-reversion сигналов',
  },

  // ── s3 · Pocket Tools ──────────────────────────────────────────────
  // Channel topic: single-tap utilities. Strict resource budget. Free-tier default.

  {
    id: 'u6', kind: 'tool', title: 'Cyprus VAT calculator',
    subtitle: 'Net ⇄ gross · мгновенно · без аналитики',
    author: authors.ivan, spaceId: 's3',
    env: ['node:20'], mcp: [],
    payload: { rate: 0.19, examples: [{ net: 100, gross: 119 }, { net: 250, gross: 297.5 }] },
    license: { kind: 'free' },
    stats: { views: 41_000, spins: 1_120, cherries: 2_240, givers: 6 },
    generation: 0, branch: 'main', commitHash: nextCommit(), forks: 1120, openPRs: 1, registryHash: nextHash(),
    createdAt: '2026-06-12T09:00:00Z',
    origin: 'handmade', appDescription: 'Калькулятор VAT 19 % (Кипр)',
  },
  {
    id: 'u7', kind: 'tool', title: 'Markdown → 9:16 carousel',
    subtitle: 'Вставь MD — получи дек слайдов под Stories · respin под свой бренд',
    author: authors.ivan, spaceId: 's3',
    env: ['node:20'], mcp: ['mcp://design/figma'],
    payload: { sample: 'Heading\n— bullet one\n— bullet two', slides: 4 },
    license: { kind: 'micro-paid', spinPrice: 0.20, revenueShareBps: 300 },
    stats: { views: 18_400, spins: 612, cherries: 1_410, givers: 18 },
    generation: 0, branch: 'main', commitHash: nextCommit(), forks: 612, openPRs: 4, registryHash: nextHash(),
    createdAt: '2026-06-15T17:00:00Z',
    origin: 'respinned', appDescription: 'Markdown → 9:16 карусель-дек',
  },
  {
    id: 'u15', kind: 'tool', title: 'QR · ссылка → штрих',
    subtitle: 'Generator с встроенным trackable redirect · CSV всех сканов',
    author: authors.ivan, spaceId: 's3',
    env: ['node:20'], mcp: [],
    payload: { url: 'https://taktak.app/u/example', size: 512, ecc: 'M', scans: 0 },
    license: { kind: 'free' },
    stats: { views: 9_800, spins: 240, cherries: 612, givers: 3 },
    generation: 0, branch: 'main', commitHash: nextCommit(), forks: 240, openPRs: 0, registryHash: nextHash(),
    createdAt: '2026-06-16T10:30:00Z',
    origin: 'handmade', appDescription: 'QR-код с трекингом сканов',
  },

  // ── s4 · Slow Market ───────────────────────────────────────────────
  // Channel topic: hand-made commerce. Proprietary-default. Escrow-on-ship.

  {
    id: 'u8', kind: 'commerce', title: 'Hand-thrown bowl · ash glaze',
    subtitle: 'Edition 03 / 12 · ships from Paphos, CY',
    author: authors.liu, spaceId: 's4',
    env: [], mcp: ['mcp://payments/stripe'],
    payload: { priceUsd: 84, edition: '03 / 12', shipsFrom: 'Paphos, CY', images: 4 },
    license: { kind: 'proprietary', revenueShareBps: 0 },
    stats: { views: 2_100, spins: 0, cherries: 280, givers: 9 },
    generation: 0, branch: 'main', commitHash: nextCommit(), forks: 0, openPRs: 0, registryHash: nextHash(),
    createdAt: '2026-06-17T10:00:00Z',
    origin: 'handmade', appDescription: 'Карточка товара · оформление заказа',
  },
  {
    id: 'u9', kind: 'content', title: 'Как я считал цену миски',
    subtitle: 'Видео 90 сек · respin → шаблон для своего товара',
    author: authors.liu, spaceId: 's4',
    env: ['node:20'], mcp: [], promptTemplate: 'Write a 90s video script explaining the price of {item}.',
    payload: { videoSeconds: 88, transcript: 'Глина, топливо, печь, руки, время, свет. Цена — это разговор.' },
    links: [{ targetUnitId: 'u8', label: '← О чём пост: миска', kind: 'reference' }],
    license: { kind: 'micro-paid', spinPrice: 0.10, revenueShareBps: 200 },
    stats: { views: 5_600, spins: 88, cherries: 720, givers: 14 },
    generation: 0, branch: 'main', commitHash: nextCommit(), forks: 88, openPRs: 0, registryHash: nextHash(),
    createdAt: '2026-06-18T14:00:00Z',
    origin: 'handmade', appDescription: 'Короткое видео о ценообразовании',
  },
  {
    id: 'u16', kind: 'commerce', title: 'Olive wood spoon set · 3 шт',
    subtitle: 'Резка вручную · масло грецкого ореха · ships from Paphos',
    author: authors.liu, spaceId: 's4',
    env: [], mcp: ['mcp://payments/stripe', 'mcp://shipping/easypost'],
    payload: { priceUsd: 38, edition: 'open', shipsFrom: 'Paphos, CY', images: 3 },
    license: { kind: 'proprietary', revenueShareBps: 0 },
    stats: { views: 1_540, spins: 0, cherries: 180, givers: 4 },
    generation: 0, branch: 'main', commitHash: nextCommit(), forks: 0, openPRs: 0, registryHash: nextHash(),
    createdAt: '2026-06-20T09:00:00Z',
    origin: 'handmade', appDescription: 'Набор оливковых ложек · 3 шт',
  },
  // Patronage Pass — physical revenue-share cards. Lives in Slow Market by design:
  // it is itself a hand-made physical-card subscription product.
  {
    id: 'u11', kind: 'pass', title: 'Patronage Pass · Liu Studio',
    subtitle: 'Физическая revenue-share карта · 3 tier · ships from Paphos',
    author: authors.liu, spaceId: 's4',
    env: ['node:20'], mcp: ['mcp://payments/stripe', 'mcp://shipping/easypost'],
    payload: {
      tagline: 'Hold a physical card, hold a slice of every Spin.',
      tiers: [
        { id: 'bronze', name: 'Bronze', priceUsd: 25,  revBps: 50,  color: '#A06B3F', subtitle: 'matte card + monthly digest' },
        { id: 'silver', name: 'Silver', priceUsd: 100, revBps: 150, color: '#C0C7CF', subtitle: 'metal card + early access' },
        { id: 'gold',   name: 'Gold',   priceUsd: 500, revBps: 500, color: '#D4AF37', subtitle: 'engraved card + 1:1 monthly call' },
      ],
      backers: 142,
      currency: 'USDC',
    },
    overlay: {
      cssVars: { '--accent': '#D4AF37' },
      fnButtons: [
        { id: 'buy', labelOverride: 'Оформить pass' },
        { id: 'contact' },
        { id: 'shipping' },
      ],
    },
    license: { kind: 'patronage', revenueShareBps: 500 },
    stats: { views: 6_800, spins: 12, cherries: 410, givers: 142 },
    generation: 0, branch: 'main', commitHash: nextCommit(), forks: 12, openPRs: 0, registryHash: nextHash(),
    createdAt: '2026-06-20T11:00:00Z',
    origin: 'handmade', appDescription: 'Покровительский pass · физические карты',
  },

  // ── s5 · Agents Guild ──────────────────────────────────────────────
  // Channel topic: specialist AI agents — pay-per-task or patronage. NOT Pine-specific.

  {
    id: 'u17', kind: 'agent', title: 'Translator · Ru ↔ En · технотексты',
    subtitle: 'Переводит документацию, сохраняет код-блоки и markdown',
    author: authors.oren, spaceId: 's5',
    env: ['python:3.11'], mcp: [], llm: 'community:llama-3.1-70b',
    routePolicy: 'hybrid',
    promptTemplate: 'Translate {text} from {src} to {dst}. Preserve code fences, KaTeX, links.',
    payload: { lastReply: 'Готов перевести. Вставь markdown или скинь .md файл.' },
    overlay: {
      fnButtons: [
        { id: 'ask', labelOverride: 'Перевести' },
        { id: 'attach', labelOverride: 'Прикрепить .md' },
        { id: 'export' },
      ],
    },
    license: { kind: 'micro-paid', spinPrice: 0.05, revenueShareBps: 500 },
    stats: { views: 12_300, spins: 1_840, cherries: 612, givers: 21 },
    generation: 0, branch: 'main', commitHash: nextCommit(), forks: 1_840, openPRs: 3, registryHash: nextHash(),
    createdAt: '2026-06-19T10:00:00Z',
    origin: 'handmade', appDescription: 'Технический переводчик Ru↔En',
  },
  {
    id: 'u18', kind: 'agent', title: 'News-tape · крипто-десаммари',
    subtitle: 'Summarises crypto news feed каждые 15 минут · фильтр по тикерам',
    author: authors.oren, spaceId: 's5',
    env: ['python:3.11'], mcp: ['mcp://news'], llm: 'bittensor:subnet-9',
    routePolicy: 'cold',
    promptTemplate: 'Summarise last {window} of crypto news. Focus tickers: {tickers}.',
    payload: { lastReply: 'BTC: спот-ETF приток $112M (4-й день подряд). ETH: Pectra-тестnet прошёл валидаторские проверки. SOL: 200ms блок-таймы держатся.' },
    overlay: {
      fnButtons: [
        { id: 'ask', labelOverride: 'Спросить про тикер' },
        { id: 'history' },
        { id: 'export', labelOverride: 'Экспорт в RSS' },
      ],
    },
    license: { kind: 'patronage', revenueShareBps: 1200 },
    stats: { views: 8_400, spins: 92, cherries: 340, givers: 64 },
    generation: 0, branch: 'main', commitHash: nextCommit(), forks: 92, openPRs: 1, registryHash: nextHash(),
    createdAt: '2026-06-20T07:00:00Z',
    origin: 'freelanced', appDescription: 'Саммари крипто-новостей каждые 15 мин',
  },

  // ── s6 · Brick & Mortar ────────────────────────────────────────────
  // Channel topic: local brick-and-mortar with online manifest.

  {
    id: 'u12', kind: 'commerce', title: 'Phaedra’s Coffee · Никосия',
    subtitle: 'Specialty coffee · Ledra St 47 · открыто сейчас (07:00–19:00)',
    author: authors.costa, spaceId: 's6',
    env: [], mcp: ['mcp://maps', 'mcp://payments/stripe', 'mcp://loyalty'],
    payload: {
      kind: 'brick-and-mortar',
      address: 'Ledra Street 47, Nicosia 1010, CY',
      coords: { lat: 35.1733, lng: 33.3631 },
      hours: [
        { day: 'Пн–Пт', open: '07:00', close: '19:00' },
        { day: 'Сб',    open: '08:00', close: '20:00' },
        { day: 'Вс',    open: '09:00', close: '17:00' },
      ],
      isOpenNow: true,
      menu: [
        { name: 'Filter · Кипр single-origin', priceEur: 3.20 },
        { name: 'Cortado',                       priceEur: 3.50 },
        { name: 'V60 · выбор недели',           priceEur: 4.80 },
        { name: 'Кардамон-булочка',          priceEur: 2.60 },
      ],
      loyalty: { stamps: 4, neededForFree: 10 },
      photos: 6,
      sellsBeans: true,
      acceptsCrypto: true,
    },
    overlay: {
      cssVars: { '--accent': '#A0522D' },
      fnButtons: [
        { id: 'buy',     labelOverride: 'Открыть меню' },
        { id: 'contact', labelOverride: 'Позвонить' },
        { id: 'shipping',labelOverride: 'Маршрут' },
      ],
    },
    license: { kind: 'proprietary', revenueShareBps: 0, aiTraining: 'allow' },
    stats: { views: 14_200, spins: 4, cherries: 312, givers: 38 },
    generation: 0, branch: 'main', commitHash: nextCommit(), forks: 4, openPRs: 0, registryHash: nextHash(),
    createdAt: '2026-06-21T08:00:00Z',
    origin: 'handmade', appDescription: 'Кафе · меню, часы, адрес, loyalty',
  },
  {
    id: 'u19', kind: 'commerce', title: 'Larnaca Surf School',
    subtitle: 'Школа сёрфинга · Mackenzie Beach · бронь уроков на сегодня',
    author: authors.liu, spaceId: 's6',
    env: [], mcp: ['mcp://maps', 'mcp://payments/stripe', 'mcp://booking'],
    payload: {
      kind: 'brick-and-mortar',
      address: 'Mackenzie Beach 24B, Larnaca 6028, CY',
      coords: { lat: 34.8742, lng: 33.6519 },
      hours: [
        { day: 'Пн–Пт', open: '08:00', close: '19:00' },
        { day: 'Сб',    open: '07:00', close: '20:00' },
        { day: 'Вс',    open: '07:00', close: '20:00' },
      ],
      isOpenNow: true,
      menu: [
        { name: 'Group lesson · 90 мин',  priceEur: 35 },
        { name: 'Private · 60 мин',        priceEur: 70 },
        { name: 'Доска на день',           priceEur: 25 },
        { name: 'Wetsuit на день',          priceEur: 10 },
      ],
      loyalty: { stamps: 2, neededForFree: 8 },
      photos: 6,
      sellsBeans: false,
      acceptsCrypto: false,
    },
    overlay: {
      cssVars: { '--accent': '#0EA5E9' },
      fnButtons: [
        { id: 'buy',     labelOverride: 'Забронировать' },
        { id: 'contact', labelOverride: 'Позвонить' },
        { id: 'shipping',labelOverride: 'Маршрут' },
      ],
    },
    license: { kind: 'proprietary', revenueShareBps: 0 },
    stats: { views: 6_400, spins: 2, cherries: 142, givers: 11 },
    generation: 0, branch: 'main', commitHash: nextCommit(), forks: 2, openPRs: 0, registryHash: nextHash(),
    createdAt: '2026-06-20T13:00:00Z',
    origin: 'handmade', appDescription: 'Школа сёрфинга · онлайн-бронь',
  },

  // ── s7 · Pine Craft ────────────────────────────────────────────────
  // Channel topic: Pine Script v6 — code-craft & indicator design.

  {
    id: 'u13', kind: 'content', title: 'KAMA как замена EMA',
    subtitle: 'Короткая заметка: меньше шумных пересечений в боковике',
    author: authors.nadia, spaceId: 's2',
    env: ['pine:6'], mcp: ['mcp://tv/pine-guard'],
    promptTemplate: 'Сравнить {indicator} и EMA по шумности на боковике.',
    payload: {
      body: 'KAMA адаптирует сглаживание под волатильность. В боковике — шире окно, меньше ложных пересечений. На тренде — наоборот: окно сужается, лаг падает. Подходит как замена EMA в любой системе пересечений.',
      readingMinutes: 2,
    },
    links: [{ targetUnitId: 'u20', label: '→ Starter pack: KAMA в наборе', kind: 'dependency' }],
    license: { kind: 'free', revenueShareBps: 100, aiTraining: 'opt-in-only' },
    stats: { views: 4_900, spins: 73, cherries: 412, givers: 8 },
    generation: 0, branch: 'main', commitHash: nextCommit(), forks: 73, openPRs: 1, registryHash: nextHash(),
    createdAt: '2026-06-20T15:00:00Z',
    origin: 'handmade', appDescription: 'Короткая Pine-заметка',
  },
  {
    id: 'u20', kind: 'tool', title: 'Pine v6 starter pack · 7 индикаторов',
    subtitle: 'KAMA · VWAP · ATR-trail · Donchian · Z-score · OBV · разделитель сессий',
    author: authors.nadia, spaceId: 's2',
    env: ['pine:6'], mcp: ['mcp://tv/pine-guard'],
    promptTemplate: 'Pine v6 indicator set: {indicators}. Output single .pine file.',
    payload: { rate: 0, examples: [{ net: 7, gross: 7 }], indicators: 7, fileSizeKb: 12.4 },
    overlay: {
      cssVars: { '--accent': '#0EA5E9' },
      fnButtons: [
        { id: 'run', labelOverride: 'Открыть в TradingView' },
        { id: 'copy', labelOverride: 'Скопировать .pine' },
        { id: 'docs' },
      ],
    },
    license: { kind: 'micro-paid', spinPrice: 0.40, revenueShareBps: 400 },
    stats: { views: 7_200, spins: 312, cherries: 1_120, givers: 27 },
    generation: 0, branch: 'main', commitHash: nextCommit(), forks: 312, openPRs: 5, registryHash: nextHash(),
    createdAt: '2026-06-18T20:00:00Z',
    origin: 'handmade', appDescription: 'Стартовый набор Pine v6',
  },
  {
    id: 'u10', kind: 'agent', title: 'Pine Script reviewer',
    subtitle: 'Вставь .pine — получи рефакторинг + анализ памяти',
    author: authors.oren, spaceId: 's2',
    env: ['node:20'], mcp: ['mcp://tv/pine-guard'], llm: 'community:codellama-34b',
    routePolicy: 'cold',
    promptTemplate: 'You are a Pine v6 reviewer. Review {script}. Flag memory bombs, suggest refactor.',
    payload: { lastReply: 'Detected unbounded array growth in var arr = array.new<float>(). Bound it with array.shift().' },
    overlay: {
      cssVars: { '--accent': '#A78BFA' },
      fnButtons: [
        { id: 'ask' },
        { id: 'attach', labelOverride: 'Прикрепить .pine' },
        { id: 'history' },
      ],
    },
    links: [{ targetUnitId: 'u20', label: '← Прогнать starter pack', kind: 'reference' }],
    license: { kind: 'patronage', revenueShareBps: 1500 },
    stats: { views: 3_400, spins: 121, cherries: 580, givers: 22 },
    generation: 0, branch: 'pine-v6-memory-fix', commitHash: nextCommit(), forks: 121, openPRs: 7, registryHash: nextHash(),
    createdAt: '2026-06-19T22:00:00Z',
    origin: 'freelanced', appDescription: 'Ревьюер Pine Script v6',
  },

  // ── s8 · Town Hall ─────────────────────────────────────────────────
  // Channel topic: community essays, polls, governance signals. No paid content.

  {
    id: 'u1', kind: 'content', title: 'The shape of attention',
    subtitle: 'Короткое эссе: почему swipe-feed — это координатная плоскость',
    author: authors.zara, spaceId: 's8',
    env: ['node:20'], mcp: [], promptTemplate: 'Write a 150-word essay on {topic} in calm voice.',
    routePolicy: 'cold',
    payload: { body: `When a feed scrolls only one way, it becomes a river. When it scrolls in two, it becomes a field — and a field can be sown.\n\nTak-Tak is not a feed. It is a coordinate plane: vertical for depth inside a topic, horizontal for jumping between topics. The unit you are reading is the smallest possible space — one author, one license, one payload.`, readingMinutes: 1 },
    links: [
      { targetUnitId: 'u3', label: 'Голосование: цвет протокола', kind: 'reference' },
    ],
    license: { kind: 'free', aiTraining: 'opt-in-only' },
    stats: { views: 12_400, spins: 318, cherries: 1_201, givers: 14 },
    generation: 0, branch: 'main', commitHash: nextCommit(), forks: 318, openPRs: 2, registryHash: nextHash(),
    createdAt: '2026-06-18T09:00:00Z',
    origin: 'handmade', appDescription: 'Эссе о форме внимания',
  },
  {
    id: 'u3', kind: 'interactive', title: 'Какой цвет «по-Tak-Tak’овски»?',
    subtitle: 'Голосование за цвет протокола · результат идёт в engine PIP-014',
    author: authors.zara, spaceId: 's8',
    env: ['node:20'], mcp: [],
    payload: { options: [
      { label: 'Cyan ✦', votes: 1820, hex: '#22D3EE' },
      { label: 'Amber ✧', votes: 1402, hex: '#F59E0B' },
      { label: 'Ink ✶', votes: 880, hex: '#1E293B' },
    ] },
    links: [{ targetUnitId: 'u1', label: '← Контекст эссе', kind: 'parent' }],
    license: { kind: 'free' },
    stats: { views: 22_300, spins: 41, cherries: 3_100, givers: 2 },
    generation: 0, branch: 'main', commitHash: nextCommit(), forks: 41, openPRs: 0, registryHash: nextHash(),
    createdAt: '2026-06-20T13:00:00Z',
    origin: 'handmade', appDescription: 'Голосование за цвет протокола',
  },
  {
    id: 'u21', kind: 'interactive', title: 'PIP-018: открыть community Spin pricing?',
    subtitle: 'Engine governance · 66 % порог стейк-репутации · голосование 7 дней',
    author: authors.community, spaceId: 's8',
    env: ['node:20'], mcp: [],
    payload: { options: [
      { label: 'За (free pricing)',   votes: 4_120, hex: '#4CAF50' },
      { label: 'Против (rangelimit)', votes: 1_890, hex: '#FFB74D' },
      { label: 'Воздержался',        votes: 412, hex: '#9CA3AF' },
    ] },
    license: { kind: 'free' },
    stats: { views: 8_900, spins: 12, cherries: 1_240, givers: 38 },
    generation: 0, branch: 'main', commitHash: nextCommit(), forks: 12, openPRs: 0, registryHash: nextHash(),
    createdAt: '2026-06-20T09:00:00Z',
    origin: 'handmade', appDescription: 'PIP-018 голосование',
  },

  // ── s7 · Investment ─────────────────────────────────────────────────
  // Channel topic: experts rate projects on Tak-Tak, users debate thesis,
  // decide whom to back via Give. Read-only opinions; no platform-managed picks.

  {
    id: 'u30', kind: 'content', title: 'Phaedra’s Coffee — expansion thesis',
    subtitle: 'Liu Wei разбирает: метрики, юнит-экономика, риски, Give-таргет $4.2k',
    author: authors.liu, spaceId: 's7',
    env: ['node:20'], mcp: [],
    promptTemplate: 'Write an investment thesis on {targetAccount} with sections: metrics, unit economics, risks, ask.',
    routePolicy: 'cold',
    payload: {
      body: `Phaedra’s Coffee — кофейня в старом городе Никосии, ведёт unit-манифест в Brick & Mortar (s6).\n\nМетрики (90 дней): 4 200 visitors/мес, средний чек €6.40, 60-day retention 31 %. Loyalty NFT-карта роздана 612 раз, конверсия в повторный визит — 44 %.\n\nЮнит-экономика: GM 62 %, OM 18 %, CAC через Tak-Tak ≈ 0. Раунд расширения: вторая точка в Ларнаке, ask €3 800 (оборудование) + €400 на freelance-дизайнерскую серию loyalty-карт (Revenue Pass higher-tier: уникальные принты, collectible+thank-you layer).\n\nРиски: сезонность Ларнаки, конкуренция, импорт зерна. Mitigations: contingency 15 %, CAPEX-лимит.\n\nGive-таргет: $4 200, charity-link (commissionless). Не инвест-рекомендация — личный анализ.`,
      readingMinutes: 3,
      targetAccountId: 'a6',
    },
    links: [{ targetUnitId: 'u12', label: 'Открыть Phaedra’s', kind: 'reference' }],
    license: { kind: 'free' },
    stats: { views: 6_100, spins: 84, cherries: 412, givers: 27 },
    generation: 0, branch: 'main', commitHash: nextCommit(), forks: 6, openPRs: 1, registryHash: nextHash(),
    createdAt: '2026-06-21T10:00:00Z',
    origin: 'handmade', appDescription: 'Инвест-тезис: Phaedra’s Coffee',
  },
  {
    id: 'u31', kind: 'content', title: 'Larnaca Surf School — Q3 анализ',
    subtitle: 'Oren A. оценивает спрос, capex на wing-foil, downside',
    author: authors.oren, spaceId: 's7',
    env: ['node:20'], mcp: [],
    promptTemplate: 'Write a thesis on {targetAccount} with seasonality and capex breakdown.',
    routePolicy: 'cold',
    payload: {
      body: `Larnaca Surf School ведёт unit-манифест уроков, графика приливов, календарь. Q2: 318 уроков, avg €45, no-show 6 %.\n\nQ3 thesis: лето — пик (×2.4 от Q2). Capex 6 wing-foil + 4 wetsuit, €5 200. Break-even — 116 уроков; запас комфортный.\n\nДискуссия: (1) погодная экспозиция — ваучеры возврата через unit-флоу; (2) дифференциация от конкурентов на МакКензи — единственная школа с TT-манифестом и онлайн-расписанием. Unfair distribution.\n\nMy take: положительный тезис, Give-таргет $5 000, commission-link (token attribution).`,
      readingMinutes: 2,
      targetAccountId: 'a4',
    },
    links: [{ targetUnitId: 'u19', label: 'Larnaca Surf School', kind: 'reference' }],
    license: { kind: 'free' },
    stats: { views: 4_300, spins: 52, cherries: 281, givers: 14 },
    generation: 0, branch: 'main', commitHash: nextCommit(), forks: 3, openPRs: 0, registryHash: nextHash(),
    createdAt: '2026-06-20T15:00:00Z',
    origin: 'handmade', appDescription: 'Инвест-тезис: Larnaca Surf School',
  },
  {
    id: 'u32', kind: 'content', title: 'Q2 2026 — Tak-Tak ecosystem capital map',
    subtitle: 'Community-отчёт: запросы Give по спейсам, hit-rate, провалы',
    author: authors.community, spaceId: 's7',
    env: ['node:20'], mcp: [],
    promptTemplate: 'Aggregate Give-flow per project for the period {from}..{to}.',
    routePolicy: 'cold',
    payload: {
      body: `Q2 2026, агрегат по всем спейсам кроме Town Hall:\n\n• Brick & Mortar (s6): 24 запроса Give, avg таргет $1 800, hit-rate 71 %. Лидер — Phaedra’s.\n• Quant Lab (s2): 11 запросов (OSS-инструменты), $400–$2 200, hit-rate 64 %.\n• Garden (s4): 8 seed-запросов, hit-rate 38 % (низкий: большие таргеты, слабые манифесты).\n• AR Tales (s5): 6 запросов, hit-rate 50 %.\n\nGive Q2: $187 400, 41 % через charity-link (no commission). Частый pattern неудач — размытый ask без unit-экономики.\n\nPlatform stance: no centralized advertising, no sponsored placements. Investment-спейс — лента мнений, не market-maker.`,
      readingMinutes: 4,
    },
    license: { kind: 'free' },
    stats: { views: 11_200, spins: 198, cherries: 920, givers: 5 },
    generation: 0, branch: 'main', commitHash: nextCommit(), forks: 12, openPRs: 3, registryHash: nextHash(),
    createdAt: '2026-06-19T08:00:00Z',
    origin: 'handmade', appDescription: 'Q2 capital map',
  },
  {
    id: 'u33', kind: 'interactive', title: 'Куда направить $20k community treasury?',
    subtitle: 'Открытый опрос · non-binding signal для кураторов',
    author: authors.community, spaceId: 's7',
    env: ['node:20'], mcp: [],
    payload: { options: [
      { label: 'Гранты Garden seed',         votes: 1_240, hex: '#10B981' },
      { label: 'OSS инструменты Quant',      votes:   980, hex: '#22D3EE' },
      { label: 'Brick&Mortar matching-fund', votes: 1_510, hex: '#F59E0B' },
      { label: 'Резерв (не тратить)',        votes:   620, hex: '#9CA3AF' },
    ] },
    links: [{ targetUnitId: 'u32', label: '← Q2 capital map', kind: 'parent' }],
    license: { kind: 'free' },
    stats: { views: 7_800, spins: 24, cherries: 612, givers: 0 },
    generation: 0, branch: 'main', commitHash: nextCommit(), forks: 8, openPRs: 0, registryHash: nextHash(),
    createdAt: '2026-06-21T07:00:00Z',
    origin: 'handmade', appDescription: 'Голосование по treasury',
  },
];

// Quick lookups
export const unitsBySpace: Record<string, UnitManifest[]> = spaces.reduce((acc, s) => {
  acc[s.id] = units.filter(u => u.spaceId === s.id);
  return acc;
}, {} as Record<string, UnitManifest[]>);

// For-You and Local are FILTER VIEWS, not standalone channels.
// Their feeds aggregate units from other spaces — units are not duplicated,
// they keep their native spaceId. The strip pins these two filters as sticky.
const byId = (id: string) => units.find(u => u.id === id)!;

// For-You: hand-curated cross-space mix.
unitsBySpace['s1'] = [
  byId('u1'),    // s8 Town Hall · эссе (entry vibe — что такое Tak-Tak)
  byId('u12'),   // s6 Brick & Mortar · кафе в Никосии
  byId('u2'),    // s2 Quant Lab · ордербук BTC/USDT
  byId('u20'),   // s7 Pine Craft · starter pack
  byId('u8'),    // s4 Slow Market · керамика
  byId('u17'),   // s5 Agents Guild · переводчик
  byId('u6'),    // s3 Pocket Tools · VAT calc
  byId('u21'),   // s8 Town Hall · голосование PIP-018
  byId('u4'),    // s2 Quant Lab · liquidity heatmap
  byId('u11'),   // s4 Slow Market · patronage pass
];

// Local: geo-bound filter. Pulls units that have a physical location near the
// viewer (in this demo: Cyprus). Same accounts can appear here AND in their
// native channel (e.g. Phaedra's Coffee lives in s6 Brick & Mortar and surfaces
// in s9 Local because it's geographically close).
export const LOCAL_UNIT_IDS = ['u12', 'u19'];
unitsBySpace['s9'] = LOCAL_UNIT_IDS.map(byId);

// Identify filter-views (vs. native channels) for UI styling.
export const FILTER_VIEW_IDS = new Set(['s1', 's9']);

export const formatNum = (n: number): string => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace('.0', '') + 'k';
  return String(n);
};

export const licenseLabel = (k: LicenseKind): string => ({
  free: 'Free spin',
  'micro-paid': 'Micro-paid',
  patronage: 'Patronage',
  proprietary: 'Proprietary',
}[k]);

// ──────────────────────────────────────────────────────────────────────────────
// Brand strings — single source of truth for tagline/pitch/principles.
// Used by MVP About view, landing tak-tak.net, PDF concept doc, social cards.
// ──────────────────────────────────────────────────────────────────────────────

// English tagline — locked verbatim by user 22 Jun 2026.
export const TAGLINE_EN =
  'Tak-Tak: a Web 4.0 social network of AI-generated mini-apps. ' +
  'Swipe, spin, build, give, and control your earnings.';

// Russian pitch — three differentiators vs TikTok, locked 22 Jun 2026.
// Translated from user's Ukrainian original; Russian preferred as primary language.
export const PITCH_RU = {
  oneLiner:
    'Tak-Tak — это как TikTok, только можно инвестировать друг в друга, ' +
    'добавлять к контенту бизнес-интерактив за секунды и запрещать ' +
    'Google и другим тренироваться на твоём контенте.',
  differentiators: [
    {
      id: 'peer-investment',
      icon: '♡',
      title: 'Взаимные инвестиции',
      body:
        'Кнопка Give вместо лайка. Charity-ссылка без комиссии или ' +
        'commission-ссылка с cookie-token attribution для рефералов. ' +
        'Investment-спейс: эксперты публикуют тезисы, ты решаешь, кого поддержать.',
    },
    {
      id: 'business-interactive',
      icon: '⚡',
      title: 'Бизнес-интерактив за секунды',
      body:
        '«Хочу такие кнопки или меню, как у этого магазина» — AI добавляет ' +
        'к посту интерактивный и бизнес-функционал (заказ, бронь, голосование, ' +
        'калькулятор, агент). Каждый юнит — это маленькое приложение с прозрачным манифестом.',
    },
    {
      id: 'no-ai-training',
      icon: '⊘',
      title: 'Google не тренируется на тебе',
      body:
        'По умолчанию каждый юнит запрещает индексацию для AI-тренировок. ' +
        'Хочешь — открываешь allowlist для конкретных краулеров. ' +
        'Tak-Tak — антитеза «бесплатной фермы данных» для больших моделей.',
    },
  ],
} as const;

// Platform-level principles, surfaced in About view, landing, and PDF.
export const PLATFORM_PRINCIPLES = [
  {
    id: 'no-centralized-ads',
    icon: '⊘',
    title: 'Нет централизованной рекламы',
    body:
      'Нет рекламной биржи, нет sponsored placements, нет «boost this post». ' +
      'Видимость зарабатывается через cherries, respins и Give от сообщества.',
  },
  {
    id: 'no-ai-training-default',
    icon: '⊘',
    title: 'AI-training: deny по умолчанию',
    body:
      'Лицензия каждого юнита несёт флаг aiTraining=deny. ' +
      'Краулеры OpenAI, Google, Anthropic и других моделей не могут использовать ' +
      'контент для обучения без явного opt-in от автора.',
  },
  {
    id: 'two-link-referrals',
    icon: '⇄',
    title: 'Две ссылки рефералов',
    body:
      'Charity-ссылка (серая, без комиссии) и commission-ссылка (акцентная, ' +
      'с token attribution через cookie). Автор сам выбирает, какая нужна.',
  },
  {
    id: 'higher-tier-cards',
    icon: '◆',
    title: 'Higher-tier cards уникальны',
    body:
      'Карты верхних тиров Revenue Pass печатаются freelance-дизайнером ' +
      'или владельцем бренда. Collectible + personalisation + marketing + thank-you layer.',
  },
] as const;

// Cross-domain split — used in About view and landing.
export const DOMAINS = {
  mvp:   { url: 'https://tak-tak.ai',  label: 'tak-tak.ai',  role: 'MVP · живой клиент' },
  docs:  { url: 'https://tak-tak.net', label: 'tak-tak.net', role: 'Концепт · документация' },
} as const;

// Referral link types — used by ActionRail "Share" / GiveDrawer.
export type ReferralKind = 'charity' | 'commission';
export interface ReferralLink {
  kind: ReferralKind;
  commissionBps?: number;       // basis points, only for 'commission'
  cookieTokenTtlDays?: number;  // attribution window
}
export const REFERRAL_LABELS: Record<ReferralKind, { label: string; tone: string; note: string }> = {
  charity: {
    label: 'Charity-ссылка',
    tone: 'text-[#6B7785]',     // gray
    note: 'Без комиссии. Адресат получает 100%.',
  },
  commission: {
    label: 'Commission-ссылка',
    tone: 'text-[#F59E0B]',     // amber accent
    note: 'С комиссией реферера · cookie-token attribution.',
  },
};

// Revenue Pass tiers — higher tiers are physical collectibles printed by
// freelance designers / brand owners. Tier 0 is digital-only (default).
export interface PassTier {
  id: string;
  level: number;
  name: string;
  priceUsd: number;
  perks: string[];
  // collectible aspect: who designs the card itself.
  designer: 'system' | 'freelancer' | 'brand-owner';
  // physical print spec hint.
  physical?: { material: string; runSize: number };
  accent: string;
  iconStyle?: string; // single-line stylised brand chip
}

export const REVENUE_PASS_TIERS: PassTier[] = [
  {
    id: 't0',
    level: 0,
    name: 'Open Pass',
    priceUsd: 0,
    designer: 'system',
    accent: '#6B7785',
    perks: ['Give / Cherry / Respin', 'Charity-ссылки', 'Earnings dashboard'],
  },
  {
    id: 't1',
    level: 1,
    name: 'Author Pass',
    priceUsd: 4.99,
    designer: 'system',
    accent: '#2E7D32',
    perks: ['Commission-ссылки', 'Custom unit overlay', 'Priority Respin queue'],
  },
  {
    id: 't2',
    level: 2,
    name: 'Designer Card',
    priceUsd: 29,
    designer: 'freelancer',
    physical: { material: 'PVC с hot-stamp foil', runSize: 500 },
    accent: '#F59E0B',
    perks: [
      'Freelance-дизайнер рисует карту',
      'Collectible · numbered run /500',
      'Personal thank-you layer (авторский ASCII/handwriting)',
      'On-card marketing slot — вы выбираете что печатать',
    ],
  },
  {
    id: 't3',
    level: 3,
    name: 'Brand Card',
    priceUsd: 199,
    designer: 'brand-owner',
    physical: { material: 'Металлический ламинат · NFC chip', runSize: 100 },
    accent: '#1E88E5',
    perks: [
      'Карту печатает владелец бренда',
      'NFC · tap-to-spin-unit',
      'Numbered /100 · серийный collectible',
      'Бренд-layer на юнитах прямо в ribbon (corner watermark)',
      'Direct line к brand-owner в Brick & Mortar',
    ],
  },
];
