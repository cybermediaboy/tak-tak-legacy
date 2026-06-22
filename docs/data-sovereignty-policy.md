# Data Sovereignty Policy — Tak-Tak Web 4.0

Status: **canonical architectural requirement** (added 2026-06-21)
Owner: Engine Council
Scope: protocol layer, applies to every Space template, every Unit, every author.

---

## 0. Принцип (one-line)

**Никакого массового обучения на пользовательских данных. Совсем. Включая платформу.** Доступ для индексации внешними скрейперами/агентами — только если автор явно пометил `aiStealingFree: true` на уровне аккаунта или конкретного юнита.

Это не настройка privacy — это инвариант протокола. Engine compile-time проверяет, что ни один модуль не имеет batch-export endpoint поверх контента без `aiStealingFree` флага.

---

## 1. Что запрещено протоколом

1. **Массовое обучение моделей** на любых данных, созданных автором (тексты, изображения, видео, payload, prompt-template, поведенческие сигналы — клики, время чтения, swipe-паттерны), включая саму платформу Tak-Tak и любой её форк. Запрет распространяется на:
   - Pre-training, fine-tuning, RLHF, DPO, distillation, LoRA, любые adapter-методы.
   - Embedding-индексы для retrieval-augmentation, если retrieval отдаётся внешним моделям без согласия.
   - "Аналитические агрегаты" и "обезличенную статистику", если они служат сырьём для обучения.
2. **Скрейпинг агентами и краулерами** без явного opt-in. По умолчанию `User-Agent` любой автоматики получает `451 Unavailable For Legal Reasons` от Engine edge.
3. **Перепродажа access-логов** (кто что читал, кто сколько времени держал unit на экране) — даже самой платформе.
4. **Cross-author корреляции** для построения профилей — запрещено на уровне feed-ranker. For-You ранжируется по on-device сигналам пользователя, не по cross-user data lake.

---

## 2. Opt-in: `aiStealingFree`

Авторы могут явно открыть свой контент для внешнего обучения и индексирования. Это **opt-in**, не opt-out, и работает на двух уровнях:

### 2.1 Account-level

```ts
interface AuthorPrivacyPolicy {
  aiStealingFree: boolean;          // default: false
  scope: 'all-posts' | 'marked-only';
  // Allowed agent classes when aiStealingFree=true
  allowedAgents: Array<'crawlers' | 'training' | 'embedding-index' | 'rag-retrieval'>;
  // Author may demand attribution back in derivative outputs
  attributionRequired: boolean;
  // Author may demand revShare from commercial use
  commercialUseRevenueShareBps: number;  // 0 = free; >0 = required share
  // Robots.txt-equivalent for AI agents (rendered into HTTP headers per request)
  agentRobotsTxt: string;
}
```

Default для каждого нового аккаунта: `aiStealingFree: false`, `allowedAgents: []`.

### 2.2 Per-unit-level

Каждый Unit имеет своё поле, перекрывающее account-level в **более ограничительную** сторону:

```ts
interface UnitPrivacyOverride {
  // Author-level allows training, but THIS unit opts out
  aiStealingFreeOverride?: false;
  // Author-level closed, but THIS unit is intentionally open (e.g. docs, manifesto)
  aiStealingFreeOverride?: true;
  // Per-unit attribution / revShare may be tighter than account-level
  attributionRequired?: boolean;
  commercialUseRevenueShareBps?: number;
}
```

Правило слияния: **AND по запрету, OR по разрешению, но per-unit override может быть только более строгим** для платформы по отношению к unknown-agent классам. Это значит — author может закрыть отдельный пост даже если аккаунт открыт, но не может тайно открыть пост за пределами account-level.

### 2.3 UI

- В account settings: один тумблер `aiStealingFree` с тремя пресетами — **Closed** (default) / **Marked-only** / **All-open**.
- В composer на каждом посте: chip "🔓 aiStealingFree" под licence pill. По умолчанию выключен.
- В manifest каждого Unit: явная строка `AI access` — отображается рядом с license.

---

## 3. Архитектурные инварианты

### 3.1 No-training-by-default

- Engine core (`engine/core@0.7.x`) не содержит и не позволяет загрузить ни один модуль с capability `train-on-user-data` без подписи Author Council ≥ 2 maintainers И публичного PIP с 30-дневным окном.
- Любой LLM в whitelist (`bittensor:subnet-9`, `community:llama-3.1-70b`, `akash:gpu-pool-3` и т.д.) проходит контракт-аттестацию: провайдер криптографически подписывает что НЕ логгирует и НЕ обучается на запросах от Tak-Tak gateway.
- Provider, нарушивший аттестацию, помещается в **engine deny-list** автоматическим on-chain голосованием (60% порог).

### 3.2 Access-control layer (ACL)

Новый протокольный слой между Engine edge и payload service. **Author-controlled feed/user-data access patterns** — авторы могут наблюдать кто читает их посты и применять временные меры:

```ts
interface AccessControlPolicy {
  unitId: string | 'all-posts';     // per-unit или account-wide
  // Pattern detection thresholds
  rateLimit: {
    readsPerHourPerAccount: number;       // выше — warning
    readsPerHourPerIP: number;
    sequentialUnitSweep: number;          // последовательное чтение N+ юнитов
  };
  // Actions an author can take against a misbehaving account
  actions: Array<{
    pattern: 'rapid-sweep' | 'bot-like-cadence' | 'cross-author-harvest' | 'agent-ua' | 'custom-rule';
    customRule?: string;                  // CEL-like predicate, validated by Engine
    response: 'observe' | 'warn' | 'soft-ban' | 'hard-ban' | 'shadow-throttle';
    durationHours: number;                // 0 = permanent until lifted
    notifyAuthor: boolean;
    notifyOffender: boolean;
    reason: string;                       // shown to offender on warn/ban
  }>;
  // Whitelist — these accounts always pass
  trustedAccounts: string[];              // author ids or handles
  // Allowlist of agent classes
  allowedAgentUserAgents: string[];       // explicit list, empty = none
}
```

#### 3.3 Author dashboard surface

В user-меню (рядом с Earnings) живёт раздел **Access Patterns**:

- **Live read-stream** — кто читает ваши посты прямо сейчас, в реальном времени (анонимизированные хеши до тех пор пока pattern не triggered).
- **Anomaly feed** — алгоритм флагает аккаунты с подозрительной cadence (например: прочитал 80% твоих юнитов за 12 минут, ровными интервалами).
- **Action panel** — для каждого флагнутого аккаунта author видит: hashed id, pattern, evidence, и три кнопки: **Warn**, **Soft-ban (24h)**, **Hard-ban (permanent)**.
- **Author rules** — author может писать CEL-like правила: `reads_per_hour > 100 AND no_swipe_within_unit → soft-ban 6h`.
- **Audit log** — кто из коллег-авторов в кооперации сделал бан и почему (для shared Space-templates).

### 3.4 Где живёт state

- **Privacy flags** — on-chain в `engine/registry/base@1.0.0` через структурированный namespace `taktak://privacy/<authorId>/<unitId?>`. Иммутабельный append-only лог.
- **ACL правила** — off-chain (low-latency edge cache), но каждое **enforcement action** (ban, warn) пишется on-chain как сигнатурированный event автора. Это значит: автор не может отрицать что забанил X, а X не может отрицать что был забанен.
- **Read-stream** — pure ephemeral (sliding window 24h), никогда не пишется в долгосрочное хранилище.

### 3.5 Совместимость с federated forks

Любой форк Engine унаследует обе политики (no-mass-training + ACL) как hard-coded constraint в `engine/core`. Форк, который их убрал, **теряет совместимость с protocol-id namespace** и не сможет интероперабельно общаться с canonical Engine. Это технически делает форк-без-приватности изолированной сетью без общих авторов.

---

## 4. Что увидит сторонний AI-агент / scraper

По умолчанию (`aiStealingFree: false` на всех уровнях):

```http
HTTP/2 451 Unavailable For Legal Reasons
X-TakTak-Policy: ai-stealing=denied; author-controlled
X-TakTak-Manifest: taktak://privacy/<authorId>
Retry-After: never
```

Если автор открыл аккаунт или пост (`aiStealingFree: true`), агент получает дополнительные headers с правилами использования (attribution, revShare):

```http
HTTP/2 200 OK
X-TakTak-Policy: ai-stealing=allowed
X-TakTak-Attribution: required; format=taktak://author/<id>
X-TakTak-CommercialUse: revShareBps=500
X-TakTak-AllowedAgents: crawlers, embedding-index
```

---

## 5. Применение к существующим Units

Для всех уже опубликованных юнитов в демо-датасете флаг `aiStealingFree` устанавливается в **false по умолчанию**. Каждый Unit получает поле:

```ts
privacy: {
  aiStealingFree: false,            // default — protected
  attributionRequired: true,
  commercialUseRevenueShareBps: 1000,  // 10% if ever opened
}
```

Для community-юнитов в Town Hall (например, манифест `u1` "The shape of attention", голосование `u3`) автор может явно открыть пост — это иллюстрирует opt-in workflow в демо.

---

## 6. UI signals

- **Lock icon на каждом Unit card** — серый = closed (default), зелёный с проколом = aiStealingFree.
- **Manifest flip** — новая строка `AI access: closed (no training, no scrape)` или `AI access: open · attribution required · 5% revshare`.
- **TopBar earnings pill** — параллельно ему появится **Access Patterns pill** с цифрой количества активных warning/ban триггеров (если есть).

---

## 7. Что НЕ меняется

- Engine governance остаётся open-core (Mozilla/Chromium-style) — fork-free, signal-only.
- Author-level revenue share через `revenueShareBps` остаётся как был.
- Cherry / Respin / Give механики не меняются — все они работают **внутри** платформы между авторами с явным согласием. Это не считается "массовым обучением" — это копирование с атрибуцией.

---

## 8. Roadmap to implement

1. **Schema** — добавить `privacy` поле в `UnitManifest` и `AuthorPrivacyPolicy` в `Author`. (Data-only PR, no UI yet.)
2. **Manifest UI** — отобразить `AI access` строку в flip-карточке.
3. **ACL drawer** — раздел в user-menu рядом с Earnings: `Access Patterns`.
4. **Edge policy** — серверный middleware, который читает privacy flags из registry и принудительно возвращает 451 для unauthorised agents.
5. **Anomaly detector** — фоновая job (`engine/anomaly/sweep-detector@0.1.0`), которая флагает паттерны и шлёт в author dashboard.
6. **Engine deny-list** — on-chain голосование за нарушающих провайдеров.

Каждый шаг — отдельный PIP.

---

## 9. Compute tiers: code path vs content path (рабочая гипотеза — валидируется на сборке)

Политика "no mass-training" реализуема на двух уровнях:

- **Policy-level** (контракт + DPA + ZDR): уровни 1-3 защиты по индустриальной шкале. Это то, что предоставляют OpenAI Enterprise / Anthropic Enterprise / Perplexity Enterprise.
- **Architecture-level** (данные физически не покидают доверенный периметр): уровни 4-6 — confidential compute (TEE), on-device inference, либо subnet с deterministic verification.

Tak-Tak использует разный уровень в зависимости от **типа** обрабатываемых данных:

### Code path (template engine, schema validation, build, lint)

- Обрабатываются: код шаблона, env/MCP манифесты, lock-файлы, package metadata.
- **Уровней 1-3 достаточно.** Это не приватные данные пользователя — это публично-форкаемая структура шаблона.
- **Разрешено**: enterprise-tier API (Claude Enterprise, OpenAI Enterprise, Perplexity Enterprise Pro) при условии активного DPA и Zero Data Retention где доступно.
- Запрещено: consumer-tier тех же провайдеров (обучаются по умолчанию).

### Content path (unit body, cherry-pick, respin, post modifications)

- Обрабатываются: текст постов, личные заметки, ремиксы контента, любые поля юнита с `privacy.aiStealingFree=false`.
- **Уровней 1-3 НЕ достаточно** — даже при контрактном запрете данные физически проходят через инфраструктуру провайдера и логируются до 30 дней.
- **Разрешено** в порядке предпочтения:
  1. **L0 Manual** — ручная правка автором, без модели вообще.
  2. **L1 On-device** — локальный inference на устройстве автора (или того, кто делает respin с явного разрешения). Целевые модели: **Qwen3-4B-Instruct-2507** (лидер fine-tuned SLM), **Gemma 3 4B** (multimodal + 140 языков), **Phi-4-mini 3.8B** (reasoning на 8GB).
  3. **L2 Community-hosted** — Bittensor subnets с deterministic verification: **Targon (SN4)** для верифицируемого inference, **Chutes (SN64)** когда появится TEE-обёртка, **Nineteen (SN19)** для low-latency.
- **Запрещено**: enterprise-tier API (Claude/GPT/Perplexity Enterprise) на content path вне зависимости от DPA. Контрактный запрет — не архитектурная гарантия.

Переход между уровнями (например, L1→L2 потому что устройство не справляется) требует **явного per-unit согласия автора**, записанного в manifest.

### Latency-бюджет на content path

- TTFT < 600ms, sustained > 30 tok/s — иначе свайп-UX ломается.
- Qwen3-4B на M-class CPU: ~400ms TTFT, 50-80 tok/s. Достаточно.
- Verification pass (мелкая модель Qwen 2.5 1.5B) перед записью результата в DAG — отсекает структурные ошибки respin.
- Constrained decoding (JSON Schema + grammars) — обязателен для манифестов.
- RAG по ancestry-графу — обязателен перед respin, иначе модель галлюцинирует контекст.

### Статус

Это **рабочая гипотеза**. Валидируется на ближайшей итерации сборки MVP с реальным WebGPU-инференсом Qwen3-4B на типовом ноуте. Если latency или quality не дотянут — пересматриваем разделение L1/L2.

---

## 10. Резюме одним предложением

Tak-Tak это сеть, где **закрыто по умолчанию**: ни одна модель и ни один краулер не получает доступа к контенту автора без явного flag-а, а сам автор обладает live-инструментами наблюдения и кары для тех, кто пытается обойти политику.
