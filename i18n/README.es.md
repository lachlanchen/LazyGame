[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner — apps and four buddies](https://lazying.art/media/brand/lazyingart-intro.gif)](https://lazying.art)

# LazyGame · Marco de enseñanza de juegos

*Una base local que convierte reglas deterministas en enseñanza clara y respaldada por evidencia.*

[![Website](https://img.shields.io/badge/Website-lazying.art-0EA5E9?style=flat-square)](https://lazying.art) [![CI](https://github.com/lachlanchen/LazyGame/actions/workflows/ci.yml/badge.svg)](https://github.com/lachlanchen/LazyGame/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-22C55E?style=flat-square)](../LICENSE) [![GitHub Sponsors](https://img.shields.io/badge/Sponsor-lachlanchen-EA4AAA?style=flat-square&logo=githubsponsors)](https://github.com/sponsors/lachlanchen)

LazyGame ofrece contratos reutilizables de autoridad, candidatos legales,
redacción de información, localización, persistencia y enseñanza. Cada producto
conserva su propio motor de reglas y su historial de versiones.

<!-- support:start -->
[![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsors-EA4AAA?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/lachlanchen)
[![LazyingArt Support](https://img.shields.io/badge/LazyingArt-Support-0EA5E9?style=for-the-badge)](https://chat.lazying.art/donate)
[![PayPal Support](https://img.shields.io/badge/PayPal-Support-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen)
[![Stripe Support](https://img.shields.io/badge/Stripe-Support-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400)
<!-- support:end -->

## Vista previa

![Demostración docente de LazyGame](../docs/images/app.png)

## Principios de diseño

- Los adaptadores deterministas controlan reglas, acciones legales, puntuación, información oculta, transiciones e historial reproducible.
- Cada ID de candidato vincula estado, actor y acción; las selecciones obsoletas o inventadas se rechazan.
- Una vista previa nunca modifica la sesión y confirmar siempre es explícito.
- La evidencia de motor y modelo se separa de hechos exactos, cálculos, guía escrita y analogías.
- La interfaz de referencia admite 11 idiomas, incluido el diseño RTL para árabe.

## Contenido

| Ruta | Propósito |
| --- | --- |
| `packages/core/` | Contratos, candidatos, visibilidad, i18n, sesiones y reproducción |
| `packages/react/` | Componentes docentes accesibles y controladores React |
| `apps/demo/` | Juego de referencia pequeño pero completo |
| `LazyWeiqi/` | Submódulo [LazyWeiqi](https://github.com/lachlanchen/LazyWeiqi) |
| `LazyChess/` | [LazyChess](https://github.com/lachlanchen/LazyChess): ajedrez, xiangqi y shogi |
| `LazyPoker/` | [LazyPoker](https://github.com/lachlanchen/LazyPoker): Hold'em, bridge y guandan |
| `LazyMahjong/` | Submódulo [LazyMahjong](https://github.com/lachlanchen/LazyMahjong) |

## Inicio rápido

```bash
git clone --recurse-submodules https://github.com/lachlanchen/LazyGame.git
cd LazyGame
npm ci
npm run check
npm run app:start
```

Abre <http://127.0.0.1:8011/> para probar candidatos vinculados, vistas previas
sin mutación, confirmación explícita, evidencia localizada y reanudación local sin duplicados.

## Base de arquitectura

El contrato completo está en [`docs/framework-contract.md`](../docs/framework-contract.md).
La demo del navegador es deliberadamente de un solo escritor porque Web Storage
no ofrece transacciones multiclave; un despliegue multiusuario debe serializar el ciclo o usar una base transaccional.

## Validación

```bash
npm run lint
npm test
npm run build
npm audit --audit-level=high
git diff --check
```

Motores, modelos, bases de datos, perfiles del navegador, sesiones privadas y evidencia de ejecución quedan fuera de Git.

## Cita

Si usas LazyGame en investigación, cita el repositorio. GitHub lee
[`CITATION.cff`](../CITATION.cff) y muestra **Cite this repository**.

```bibtex
@software{chen_lazygame_2026,
  author = {Chen, Lachlan},
  title = {LazyGame: Game Teaching Framework},
  year = {2026},
  url = {https://github.com/lachlanchen/LazyGame}
}
```

## Estado y alcance

LazyGame es una base docente y una implementación de referencia, no un motor
universal ni un servidor remoto autenticado. Los cuatro productos mantienen versiones independientes y se enlazan como submódulos.
