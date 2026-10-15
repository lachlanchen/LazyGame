[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner — apps and four buddies](https://lazying.art/media/brand/lazyingart-intro.gif)](https://lazying.art)

# LazyGame · ゲーム教育フレームワーク

*決定論的なゲーム規則を、根拠が明確で分かりやすい学びへ変えるローカルファースト基盤。*

[![Website](https://img.shields.io/badge/Website-lazying.art-0EA5E9?style=flat-square)](https://lazying.art) [![CI](https://github.com/lachlanchen/LazyGame/actions/workflows/ci.yml/badge.svg)](https://github.com/lachlanchen/LazyGame/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-22C55E?style=flat-square)](../LICENSE) [![GitHub Sponsors](https://img.shields.io/badge/Sponsor-lachlanchen-EA4AAA?style=flat-square&logo=githubsponsors)](https://github.com/sponsors/lachlanchen)

LazyGame は、権限、合法手候補、情報秘匿、国際化、永続化、教育表示の
再利用可能な契約を提供します。各製品は固有のルールエンジンと独立した
リリース履歴を保ちます。

<!-- support:start -->
[![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsors-EA4AAA?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/lachlanchen)
[![LazyingArt Support](https://img.shields.io/badge/LazyingArt-Support-0EA5E9?style=for-the-badge)](https://chat.lazying.art/donate)
[![PayPal Support](https://img.shields.io/badge/PayPal-Support-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen)
[![Stripe Support](https://img.shields.io/badge/Stripe-Support-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400)
<!-- support:end -->

## プレビュー

![LazyGame 教育デモ](../docs/images/app.png)

## 設計原則

- 決定論的アダプターが規則、合法手、得点、非公開情報、状態遷移、再現可能な履歴を所有します。
- 候補 ID は状態・行為者・正規化された行動に結びつき、古い候補や偽造候補は拒否されます。
- プレビューはセッションを変更せず、確定操作は常に明示的です。
- エンジン／モデルの根拠は、正確な事実、計算、教師の説明、比喩と分けて表示します。
- 参照 UI は 11 言語とアラビア語の右から左の配置に対応します。

## ワークスペース

| パス | 役割 |
| --- | --- |
| `packages/core/` | 契約、候補、可視性、i18n、セッション、リプレイ |
| `packages/react/` | アクセシブルな教育コンポーネントと React コントローラー |
| `apps/demo/` | 小さくても完全な参照ゲーム |
| `LazyWeiqi/` | [LazyWeiqi](https://github.com/lachlanchen/LazyWeiqi) サブモジュール |
| `LazyChess/` | [LazyChess](https://github.com/lachlanchen/LazyChess)：チェス・象棋・将棋 |
| `LazyPoker/` | [LazyPoker](https://github.com/lachlanchen/LazyPoker)：Hold'em・ブリッジ・掼蛋 |
| `LazyMahjong/` | [LazyMahjong](https://github.com/lachlanchen/LazyMahjong) サブモジュール |

## クイックスタート

```bash
git clone --recurse-submodules https://github.com/lachlanchen/LazyGame.git
cd LazyGame
npm ci
npm run check
npm run app:start
```

<http://127.0.0.1:8011/> を開くと、状態に結びついた合法手、非破壊
プレビュー、明示的確定、翻訳された根拠、重複しないローカル再開を確認できます。

## アーキテクチャ基準

完全な契約は [`docs/framework-contract.md`](../docs/framework-contract.md) にあります。
Web Storage には複数キーのトランザクションがないため、ブラウザデモは意図的に
単一ライターです。複数ライター環境では処理を直列化するか、トランザクション対応 DB を使用してください。

## 検証

```bash
npm run lint
npm test
npm run build
npm audit --audit-level=high
git diff --check
```

エンジン、モデル、DB、ブラウザプロファイル、非公開セッション、実行証跡は Git に含めません。

## 引用

研究で LazyGame を使う場合はリポジトリを引用してください。GitHub は
[`CITATION.cff`](../CITATION.cff) を読み、**Cite this repository** を表示します。

```bibtex
@software{chen_lazygame_2026,
  author = {Chen, Lachlan},
  title = {LazyGame: Game Teaching Framework},
  year = {2026},
  url = {https://github.com/lachlanchen/LazyGame}
}
```

## 状態と範囲

LazyGame は教育基盤と参照実装であり、万能ルールエンジンや認証済み遠隔サーバーではありません。
4 製品は独立して版管理され、ここではサブモジュールとして接続されます。
