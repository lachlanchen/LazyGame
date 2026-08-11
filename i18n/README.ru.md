[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# LazyGame · Фреймворк обучения играм

*Локальная основа, превращающая детерминированные правила в ясное обучение с явными источниками.*

[![Website](https://img.shields.io/badge/Website-lazying.art-0EA5E9?style=flat-square)](https://lazying.art) [![CI](https://github.com/lachlanchen/LazyGame/actions/workflows/ci.yml/badge.svg)](https://github.com/lachlanchen/LazyGame/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-22C55E?style=flat-square)](../LICENSE) [![GitHub Sponsors](https://img.shields.io/badge/Sponsor-lachlanchen-EA4AAA?style=flat-square&logo=githubsponsors)](https://github.com/sponsors/lachlanchen)

LazyGame предоставляет повторно используемые контракты полномочий, легальных
кандидатов, сокрытия данных, локализации, хранения и обучения. Каждый продукт
сохраняет собственный движок правил и независимую историю выпусков.

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

## Предпросмотр

![Учебная демонстрация LazyGame](../docs/images/app.png)

## Принципы проектирования

- Детерминированные адаптеры владеют правилами, легальными действиями, счётом, скрытыми данными, переходами и воспроизводимой историей.
- ID кандидата связывает состояние, участника и каноническое действие; устаревший или поддельный выбор отклоняется.
- Предпросмотр не меняет сессию, а подтверждение всегда явно.
- Данные движка и модели отделены от точных фактов, вычислений, авторских подсказок и аналогий.
- Эталонный интерфейс поддерживает 11 языков, включая арабскую раскладку RTL.

## Рабочее пространство

| Путь | Назначение |
| --- | --- |
| `packages/core/` | Контракты, кандидаты, видимость, i18n, сессии и повтор |
| `packages/react/` | Доступные учебные компоненты и React-контроллеры |
| `apps/demo/` | Небольшая, но полная эталонная игра |
| `LazyWeiqi/` | Подмодуль [LazyWeiqi](https://github.com/lachlanchen/LazyWeiqi) |
| `LazyChess/` | [LazyChess](https://github.com/lachlanchen/LazyChess): шахматы, сянци и сёги |
| `LazyPoker/` | [LazyPoker](https://github.com/lachlanchen/LazyPoker): Hold'em, бридж и гуандан |
| `LazyMahjong/` | Подмодуль [LazyMahjong](https://github.com/lachlanchen/LazyMahjong) |

## Быстрый старт

```bash
git clone --recurse-submodules https://github.com/lachlanchen/LazyGame.git
cd LazyGame
npm ci
npm run check
npm run app:start
```

Откройте <http://127.0.0.1:8011/>, чтобы увидеть связанные кандидаты,
немутирующий предпросмотр, явное подтверждение, локализованные источники и возобновление без дублей.

## Архитектурная основа

Полный контракт находится в [`docs/framework-contract.md`](../docs/framework-contract.md).
Браузерная демонстрация намеренно однописательная: Web Storage не имеет
транзакций по нескольким ключам. Несколько писателей требуют сериализации или транзакционной БД.

## Проверка

```bash
npm run lint
npm test
npm run build
npm audit --audit-level=high
git diff --check
```

Движки, модели, базы, профили браузера, частные сессии и рабочие свидетельства не попадают в Git.

## Цитирование

Если вы используете LazyGame в исследовании, цитируйте репозиторий. GitHub читает
[`CITATION.cff`](../CITATION.cff) и показывает **Cite this repository**.

```bibtex
@software{chen_lazygame_2026,
  author = {Chen, Lachlan},
  title = {LazyGame: Game Teaching Framework},
  year = {2026},
  url = {https://github.com/lachlanchen/LazyGame}
}
```

## Статус и границы

LazyGame — учебная основа и эталонная реализация, а не универсальный движок правил
или удалённый сервер с аутентификацией. Четыре продукта версионируются независимо и подключены как подмодули.
