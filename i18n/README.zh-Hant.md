[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner — apps and four buddies](https://github.com/lachlanchen/LazyingArtWebsite/raw/main/media/brand/lazyingart-intro.gif)](https://lazying.art)

# LazyGame · 遊戲教學框架

*以本機優先的方式，把確定性遊戲規則變成清楚、有證據邊界的教學。*

[![Website](https://img.shields.io/badge/Website-lazying.art-0EA5E9?style=flat-square)](https://lazying.art) [![CI](https://github.com/lachlanchen/LazyGame/actions/workflows/ci.yml/badge.svg)](https://github.com/lachlanchen/LazyGame/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-22C55E?style=flat-square)](../LICENSE) [![GitHub Sponsors](https://img.shields.io/badge/Sponsor-lachlanchen-EA4AAA?style=flat-square&logo=githubsponsors)](https://github.com/sponsors/lachlanchen)

LazyGame 提供可重用的權威狀態、合法候選、資訊隱藏、國際化、持久化和
教學契約。每個產品保留自己的規則引擎和獨立發佈歷史，不把不同遊戲硬套進同一套規則。

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

## 預覽

![LazyGame 教學示範](../docs/images/app.png)

## 設計原則

- 確定性適配器負責規則、合法行動、計分、隱藏資訊、狀態轉移和可重播歷史。
- 候選 ID 綁定完整狀態、行動者與標準化行動；過期或偽造選擇會被拒絕。
- 預覽絕不修改工作階段，落子或行動必須明確確認。
- 引擎與模型證據和精確事實、計算、教師編寫內容、類比分開標示。
- 參考介面支援 11 種語言，並為阿拉伯語提供由右至左版面。

## 工作區內容

| 路徑 | 用途 |
| --- | --- |
| `packages/core/` | 契約、候選綁定、可見性、i18n、工作階段與重播 |
| `packages/react/` | 無障礙教學元件與 React 控制器 |
| `apps/demo/` | 小而完整的參考遊戲 |
| `LazyWeiqi/` | [LazyWeiqi](https://github.com/lachlanchen/LazyWeiqi) 子模組 |
| `LazyChess/` | [LazyChess](https://github.com/lachlanchen/LazyChess)：國際象棋、象棋和將棋 |
| `LazyPoker/` | [LazyPoker](https://github.com/lachlanchen/LazyPoker)：德州撲克、橋牌和摜蛋 |
| `LazyMahjong/` | [LazyMahjong](https://github.com/lachlanchen/LazyMahjong) 子模組 |

## 快速開始

```bash
git clone --recurse-submodules https://github.com/lachlanchen/LazyGame.git
cd LazyGame
npm ci
npm run check
npm run app:start
```

開啟 <http://127.0.0.1:8011/>，可驗證狀態綁定候選、無副作用預覽、
明確確認、多語言證據和不重複的本機繼續功能。

## 架構基線

完整契約見 [`docs/framework-contract.md`](../docs/framework-contract.md)。
Web Storage 不具備多鍵交易，因此瀏覽器示範刻意採單一寫入者；多分頁或伺服器部署
必須序列化整個生命週期，或使用支援交易的資料庫。

## 驗證

```bash
npm run lint
npm test
npm run build
npm audit --audit-level=high
git diff --check
```

下載的引擎、模型、資料庫、瀏覽器設定、私人工作階段和執行證據都保留在 Git 之外。

## 引用

若在研究中使用 LazyGame，請引用本儲存庫。GitHub 會讀取
[`CITATION.cff`](../CITATION.cff) 並顯示 **Cite this repository** 面板。

```bibtex
@software{chen_lazygame_2026,
  author = {Chen, Lachlan},
  title = {LazyGame: Game Teaching Framework},
  year = {2026},
  url = {https://github.com/lachlanchen/LazyGame}
}
```

## 狀態與範圍

LazyGame 是教學基礎和參考實作，不是萬用規則引擎，也不是具遠端驗證的遊戲伺服器。
四個產品獨立版本管理，並在此以子模組連接。
