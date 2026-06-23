# tak-tak-legacy

Снапшот MVP до перехода на spaces v6.

**HEAD: `722a058`** — `feat: INVEST-wedge repositioning + s10 Hire + ImportView + PDF v4`

Это последний коммит «Feed-first» итерации. Дальнейшая разработка (карточный hub, dynamic background, per-space interactives, memory cards, curator controls) ведётся в [`tak-tak-mvp`](https://github.com/cybermediaboy/tak-tak-mvp).

## Что внутри

- Feed-view (`client/src/pages/Feed.tsx`) как основной экран
- TopBar v3 (single-row, info-icon в углу)
- Revenue Pass UI с макетом ISO 7810
- INVEST-wedge репозиционирование (slide 10 Hire, ImportView)
- Inline-link referrals (charity/commission kinds)

## Что НЕ входит (есть только в tak-tak-mvp)

- `/s/:scene/:slugTitle` — Spaces Hub
- Per-space interactives (карусель/IDE-таблица/heatmap ликвидаций)
- Cherry-counter + respin (curator)
- Reader gestures (save / react / raise-to-chat)
- Memory cards + ThankForm
- RoleProvider + RoleDrawer
- Unclaimed banner + `/claim/:provider`

## Запуск

```bash
npm install
npm run dev
```
