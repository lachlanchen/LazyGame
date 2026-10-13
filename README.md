[English](README.md) · [العربية](i18n/README.ar.md) · [Español](i18n/README.es.md) · [Français](i18n/README.fr.md) · [日本語](i18n/README.ja.md) · [한국어](i18n/README.ko.md) · [Tiếng Việt](i18n/README.vi.md) · [中文 (简体)](i18n/README.zh-Hans.md) · [中文（繁體）](i18n/README.zh-Hant.md) · [Deutsch](i18n/README.de.md) · [Русский](i18n/README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://lazying.art)

# LazyGame · Game Teaching Framework

*A local-first foundation that turns deterministic game rules into clear, evidence-aware teaching.*

[![Website](https://img.shields.io/badge/Website-lazying.art-0EA5E9?style=flat-square)](https://lazying.art) [![CI](https://github.com/lachlanchen/LazyGame/actions/workflows/ci.yml/badge.svg)](https://github.com/lachlanchen/LazyGame/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-22C55E?style=flat-square)](LICENSE) [![GitHub Sponsors](https://img.shields.io/badge/Sponsor-lachlanchen-EA4AAA?style=flat-square&logo=githubsponsors)](https://github.com/sponsors/lachlanchen)

LazyGame provides reusable authority, legal-candidate, redaction, localization,
persistence, and teaching contracts. Each product keeps its own rules engine and
release history; the framework never pretends that one rules engine can govern
unrelated games.

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

## Preview

![LazyGame teaching demo](docs/images/app.png)

## Design principles

- Deterministic adapters own rules, legal actions, scoring, hidden information,
  state transitions, and replayable history.
- Candidate IDs bind the complete state, actor, and canonical action; stale or
  fabricated choices fail closed.
- A preview never mutates a session. Commitment is always explicit.
- Engine and model output is bounded to legal candidates and labeled separately
  from exact, calculated, authored, and analogy evidence.
- The reference interface supports English, Arabic, Spanish, French, Japanese,
  Korean, Vietnamese, Simplified Chinese, Traditional Chinese, German, and
  Russian, including right-to-left Arabic layout.

## Workspace

| Path | Purpose |
| --- | --- |
| `packages/core/` | Pure contracts, candidate binding, visibility, i18n, sessions, and replay |
| `packages/react/` | Accessible teaching components and controller hooks |
| `apps/demo/` | A compact complete reference game |
| `LazyWeiqi/` | [LazyWeiqi](https://github.com/lachlanchen/LazyWeiqi) product submodule |
| `LazyChess/` | [LazyChess](https://github.com/lachlanchen/LazyChess): Chess, Xiangqi, and Shogi |
| `LazyPoker/` | [LazyPoker](https://github.com/lachlanchen/LazyPoker): Hold'em, Bridge, and Guandan |
| `LazyMahjong/` | [LazyMahjong](https://github.com/lachlanchen/LazyMahjong) product submodule |

## Quick start

```bash
git clone --recurse-submodules https://github.com/lachlanchen/LazyGame.git
cd LazyGame
npm ci
npm run check
npm run app:start
```

Open <http://127.0.0.1:8011/>. The reference game demonstrates bound legal
candidates, non-mutating previews, explicit confirmation, localized evidence,
and duplicate-free local resume.

## Architecture baseline

The complete adapter and authority contract is in
[`docs/framework-contract.md`](docs/framework-contract.md). The browser demo is
deliberately single-writer because Web Storage cannot make its multi-key
lifecycle transactional. Production multi-tab or server deployments must
serialize the lifecycle or use a transactional database.

## Validation

```bash
npm run lint
npm test
npm run build
npm audit --audit-level=high
git diff --check
```

Downloaded engines, models, databases, browser profiles, private sessions, and
runtime evidence belong in ignored local directories and never in Git.

## Citation

If you use LazyGame in research, cite the repository. GitHub reads
[`CITATION.cff`](CITATION.cff) and shows a **Cite this repository** panel.

```bibtex
@software{chen_lazygame_2026,
  author = {Chen, Lachlan},
  title = {LazyGame: Game Teaching Framework},
  year = {2026},
  url = {https://github.com/lachlanchen/LazyGame}
}
```

## Status and scope

LazyGame is a reusable teaching foundation and reference implementation, not a
universal rules engine or remote-authenticated game server. The four product
repositories remain independently versioned and are linked here as submodules.
