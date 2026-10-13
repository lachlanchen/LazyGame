[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner — apps and four buddies](https://github.com/lachlanchen/LazyingArtWebsite/raw/main/media/brand/lazyingart-intro.gif)](https://lazying.art)

# LazyGame · 게임 교육 프레임워크

*결정론적 게임 규칙을 명확하고 근거 있는 가르침으로 바꾸는 로컬 우선 기반.*

[![Website](https://img.shields.io/badge/Website-lazying.art-0EA5E9?style=flat-square)](https://lazying.art) [![CI](https://github.com/lachlanchen/LazyGame/actions/workflows/ci.yml/badge.svg)](https://github.com/lachlanchen/LazyGame/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-22C55E?style=flat-square)](../LICENSE) [![GitHub Sponsors](https://img.shields.io/badge/Sponsor-lachlanchen-EA4AAA?style=flat-square&logo=githubsponsors)](https://github.com/sponsors/lachlanchen)

LazyGame은 권한, 합법 후보, 정보 가림, 현지화, 저장, 교육 표시를 위한
재사용 가능한 계약을 제공합니다. 각 제품은 자체 규칙 엔진과 독립적인 릴리스 기록을 유지합니다.

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

## 미리보기

![LazyGame 교육 데모](../docs/images/app.png)

## 설계 원칙

- 결정론적 어댑터가 규칙, 합법 행동, 점수, 비공개 정보, 상태 전이, 재현 가능한 기록을 소유합니다.
- 후보 ID는 전체 상태·행위자·정규 행동에 묶이며 오래되거나 조작된 선택은 거부됩니다.
- 미리보기는 세션을 바꾸지 않고, 확정은 항상 명시적입니다.
- 엔진·모델 근거는 정확한 사실, 계산, 작성된 안내, 비유와 분리해 표시합니다.
- 참조 UI는 11개 언어와 아랍어 RTL 배치를 지원합니다.

## 작업공간

| 경로 | 역할 |
| --- | --- |
| `packages/core/` | 계약, 후보, 가시성, i18n, 세션, 리플레이 |
| `packages/react/` | 접근 가능한 교육 컴포넌트와 React 컨트롤러 |
| `apps/demo/` | 작지만 완전한 참조 게임 |
| `LazyWeiqi/` | [LazyWeiqi](https://github.com/lachlanchen/LazyWeiqi) 서브모듈 |
| `LazyChess/` | [LazyChess](https://github.com/lachlanchen/LazyChess): 체스·샹치·쇼기 |
| `LazyPoker/` | [LazyPoker](https://github.com/lachlanchen/LazyPoker): Hold'em·브리지·관단 |
| `LazyMahjong/` | [LazyMahjong](https://github.com/lachlanchen/LazyMahjong) 서브모듈 |

## 빠른 시작

```bash
git clone --recurse-submodules https://github.com/lachlanchen/LazyGame.git
cd LazyGame
npm ci
npm run check
npm run app:start
```

<http://127.0.0.1:8011/>에서 상태 결합 후보, 비파괴 미리보기, 명시적 확정,
번역된 근거, 중복 없는 로컬 재개를 확인할 수 있습니다.

## 아키텍처 기준

전체 계약은 [`docs/framework-contract.md`](../docs/framework-contract.md)에 있습니다.
Web Storage는 다중 키 트랜잭션을 제공하지 않으므로 브라우저 데모는 의도적으로
단일 작성자입니다. 다중 작성자는 수명주기를 직렬화하거나 트랜잭션 DB를 사용해야 합니다.

## 검증

```bash
npm run lint
npm test
npm run build
npm audit --audit-level=high
git diff --check
```

엔진, 모델, 데이터베이스, 브라우저 프로필, 비공개 세션, 실행 증거는 Git 밖에 둡니다.

## 인용

연구에서 LazyGame을 사용한다면 저장소를 인용해 주세요. GitHub는
[`CITATION.cff`](../CITATION.cff)를 읽어 **Cite this repository** 패널을 표시합니다.

```bibtex
@software{chen_lazygame_2026,
  author = {Chen, Lachlan},
  title = {LazyGame: Game Teaching Framework},
  year = {2026},
  url = {https://github.com/lachlanchen/LazyGame}
}
```

## 상태와 범위

LazyGame은 교육 기반과 참조 구현이며 범용 규칙 엔진이나 인증된 원격 서버가 아닙니다.
네 제품은 독립적으로 버전 관리되고 이곳에 서브모듈로 연결됩니다.
