// ImportView — content-portability placeholders (OAuth + Archive ZIP per platform).
//
// Legal basis: GDPR Art. 20 + DMA → user has the RIGHT to data portability.
// Tak-Tak does NOT scrape. It helps the user exercise that right via:
//   • OAuth path     — fast, partial (TT/Meta/YT/X APIs)
//   • Archive path   — slow, complete (user downloads ZIP, we parse)
//
// MVP: UI placeholders only. No real handlers. Match PassView aesthetic.

interface ImportPlatform {
  id: string;
  name: string;
  glyph: string;
  oauthLabel: string;
  oauthAvailable: boolean;
  archiveLabel: string;
  archiveAvailable: boolean;
  note: string;
}

const IMPORT_PLATFORMS: ImportPlatform[] = [
  {
    id: 'tiktok', name: 'TikTok', glyph: '♫',
    oauthLabel: 'OAuth · Content Posting API',
    oauthAvailable: true,
    archiveLabel: 'Settings → Download your data (JSON · 24-48ч)',
    archiveAvailable: true,
    note: 'Audio stripped (музыка лицензирована внутри TT). Своё видео — ваше.',
  },
  {
    id: 'instagram', name: 'Instagram', glyph: '◈',
    oauthLabel: 'OAuth · Graph API (creator/business)',
    oauthAvailable: true,
    archiveLabel: 'Settings → Download Your Information (JSON/HTML)',
    archiveAvailable: true,
    note: 'Basic Display API закрыт 12.2024. Personal → archive only.',
  },
  {
    id: 'youtube', name: 'YouTube', glyph: '▶',
    oauthLabel: 'OAuth · Data API v3 (youtube.upload для publish-back)',
    oauthAvailable: true,
    archiveLabel: 'Google Takeout (JSON + MP4 · free)',
    archiveAvailable: true,
    note: 'Quota: ~1600/upload, 10k/день. Takeout = полный бэкап.',
  },
  {
    id: 'x', name: 'X (Twitter)', glyph: '×',
    oauthLabel: 'OAuth · X API v2 (owned-reads $0.001/post)',
    oauthAvailable: true,
    archiveLabel: 'Settings → Download archive (ZIP)',
    archiveAvailable: true,
    note: 'Archive — бесплатно и полно. API — платный реалтайм.',
  },
  {
    id: 'rss', name: 'Site / Blog', glyph: '§',
    oauthLabel: '—',
    oauthAvailable: false,
    archiveLabel: 'RSS / Atom URL · WordPress WXR · sitemap.xml',
    archiveAvailable: true,
    note: 'Open standards — никаких API-ключей, только URL вашего сайта.',
  },
  {
    id: 'mastodon', name: 'Mastodon', glyph: '⚬',
    oauthLabel: 'OAuth · ActivityPub (AccountMigration)',
    oauthAvailable: true,
    archiveLabel: 'Settings → Import/Export (.json + .csv)',
    archiveAvailable: true,
    note: 'Federated, portability — ядро протокола.',
  },
  {
    id: 'bluesky', name: 'BlueSky', glyph: '☁',
    oauthLabel: 'OAuth · ATProto (DID + PDS)',
    oauthAvailable: true,
    archiveLabel: 'PDS repo export (CAR file)',
    archiveAvailable: true,
    note: 'Portability first-class. Перенос PDS — без потери identity.',
  },
];

export function ImportView() {
  return (
    <div className="space-y-4" data-testid="view-import">
      <div>
        <h2 className="text-lg font-display font-semibold text-[#1A1A1A]">
          Перенести мой контент
        </h2>
        <p className="mt-1 text-[12px] leading-relaxed text-[#6B7785]">
          Так-Так не скрейпит чужое — помогает воспользоваться правом
          на portability (GDPR Art. 20 + DMA). Два пути на каждую платформу:
          OAuth (быстро, частично) или Archive (медленно, полностью).
          Музыка из TT/IG удаляется при импорте.
        </p>
      </div>

      <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-[11px] leading-relaxed text-[#7a5a17]" data-testid="import-note">
        Кнопки ниже — placeholders. Первый production-release ждёт OAuth-review
        от TT/Meta/YT и parser-pipeline для Takeout/ZIP. Default policy:{' '}
        <span className="font-mono">imported_from:</span> бейдж,{' '}
        <span className="font-mono">aiTraining=deny</span>.
      </div>

      <div className="space-y-2.5">
        {IMPORT_PLATFORMS.map(p => (
          <div
            key={p.id}
            data-testid={`import-platform-${p.id}`}
            className="rounded-xl border border-black/5 bg-white/70 px-3 py-3 space-y-2"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-black/[0.04] border border-black/5 flex items-center justify-center text-base text-[#1A1A1A]">
                {p.glyph}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-[#1A1A1A]">{p.name}</div>
                <div className="text-[10px] font-mono text-[#6B7785] truncate">{p.note}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={!p.oauthAvailable}
                data-testid={`import-oauth-${p.id}`}
                className={`text-left rounded-lg px-2.5 py-2 border text-[11px] leading-snug ${
                  p.oauthAvailable
                    ? 'border-emerald-500/30 bg-emerald-500/[0.06] text-[#1A1A1A] hover:bg-emerald-500/[0.10]'
                    : 'border-black/5 bg-black/[0.02] text-[#9aa3ad] cursor-not-allowed'
                }`}
                title="OAuth — быстрый экспорт через official API"
              >
                <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-700">
                  {p.oauthAvailable ? '° OAuth' : '— OAuth n/a'}
                </div>
                <div className="mt-0.5">{p.oauthLabel}</div>
              </button>
              <button
                type="button"
                disabled={!p.archiveAvailable}
                data-testid={`import-archive-${p.id}`}
                className={`text-left rounded-lg px-2.5 py-2 border text-[11px] leading-snug ${
                  p.archiveAvailable
                    ? 'border-amber-500/30 bg-amber-500/[0.06] text-[#1A1A1A] hover:bg-amber-500/[0.10]'
                    : 'border-black/5 bg-black/[0.02] text-[#9aa3ad] cursor-not-allowed'
                }`}
                title="Archive — вы скачиваете ZIP, Tak-Tak парсит в юниты"
              >
                <div className="text-[10px] font-mono uppercase tracking-wider text-amber-700">
                  ° Archive
                </div>
                <div className="mt-0.5">{p.archiveLabel}</div>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-black/[0.03] border border-black/5 px-3 py-3 text-[11px] leading-relaxed text-[#3a4148] space-y-1.5" data-testid="import-policy">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[#6B7785]">Default policy</div>
        <div>• Аудио из TikTok/Instagram удаляется (лицензированные треки · fair-use risk).</div>
        <div>• Каждый импортированный юнит получает бейдж <span className="font-mono">imported_from: tiktok</span>.</div>
        <div>• AI-training license = <span className="font-mono">deny</span> по умолчанию (можно разрешить per unit).</div>
        <div>• Ре-публикация обратно на сорс (TT → publish-back) — опция, не default.</div>
      </div>

      <div className="pt-1 text-[10px] font-mono text-[#6B7785] uppercase tracking-wider">
        legal basis · GDPR Art. 20 · DMA · hiQ v. LinkedIn · Meta v. Bright Data
      </div>
    </div>
  );
}
