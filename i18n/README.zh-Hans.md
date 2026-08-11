[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# LazyGame · 游戏教学框架

*以本地优先的方式，把确定性游戏规则变成清楚、有证据边界的教学。*

[![Website](https://img.shields.io/badge/Website-lazying.art-0EA5E9?style=flat-square)](https://lazying.art) [![CI](https://github.com/lachlanchen/LazyGame/actions/workflows/ci.yml/badge.svg)](https://github.com/lachlanchen/LazyGame/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-22C55E?style=flat-square)](../LICENSE) [![GitHub Sponsors](https://img.shields.io/badge/Sponsor-lachlanchen-EA4AAA?style=flat-square&logo=githubsponsors)](https://github.com/sponsors/lachlanchen)

LazyGame 提供可复用的权威状态、合法候选、信息隐藏、国际化、持久化和
教学契约。每个产品保留自己的规则引擎和独立发布历史，不把不同游戏硬塞进同一套规则。

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

## 预览

![LazyGame 教学演示](../docs/images/app.png)

## 设计原则

- 确定性适配器负责规则、合法行动、计分、隐藏信息、状态迁移和可重放历史。
- 候选 ID 绑定完整状态、行动者和规范化行动；过期或伪造选择会被拒绝。
- 预览绝不修改会话，落子或行动必须明确确认。
- 引擎与模型证据和精确事实、计算、教师编写内容、类比分开标注。
- 参考界面支持 11 种语言，并为阿拉伯语提供从右到左布局。

## 工作区内容

| 路径 | 用途 |
| --- | --- |
| `packages/core/` | 契约、候选绑定、可见性、i18n、会话与重放 |
| `packages/react/` | 无障碍教学组件与 React 控制器 |
| `apps/demo/` | 小而完整的参考游戏 |
| `LazyWeiqi/` | [LazyWeiqi](https://github.com/lachlanchen/LazyWeiqi) 子模块 |
| `LazyChess/` | [LazyChess](https://github.com/lachlanchen/LazyChess)：国际象棋、象棋和将棋 |
| `LazyPoker/` | [LazyPoker](https://github.com/lachlanchen/LazyPoker)：德州扑克、桥牌和掼蛋 |
| `LazyMahjong/` | [LazyMahjong](https://github.com/lachlanchen/LazyMahjong) 子模块 |

## 快速开始

```bash
git clone --recurse-submodules https://github.com/lachlanchen/LazyGame.git
cd LazyGame
npm ci
npm run check
npm run app:start
```

打开 <http://127.0.0.1:8011/>，可验证状态绑定候选、无副作用预览、
明确确认、多语言证据和不重复的本地继续功能。

## 架构基线

完整契约见 [`docs/framework-contract.md`](../docs/framework-contract.md)。
Web Storage 不具备多键事务，因此浏览器演示有意采用单写者；多标签页或服务端部署
必须串行化整个生命周期，或使用支持事务的数据库。

## 验证

```bash
npm run lint
npm test
npm run build
npm audit --audit-level=high
git diff --check
```

下载的引擎、模型、数据库、浏览器配置、私人会话和运行证据均保留在 Git 之外。

## 引用

若在研究中使用 LazyGame，请引用本仓库。GitHub 会读取
[`CITATION.cff`](../CITATION.cff) 并显示 **Cite this repository** 面板。

```bibtex
@software{chen_lazygame_2026,
  author = {Chen, Lachlan},
  title = {LazyGame: Game Teaching Framework},
  year = {2026},
  url = {https://github.com/lachlanchen/LazyGame}
}
```

## 状态与范围

LazyGame 是教学基础和参考实现，不是万能规则引擎，也不是带远程认证的游戏服务器。
四个产品独立版本管理，并在此以子模块连接。
