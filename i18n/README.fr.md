[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner — apps and four buddies](https://lazying.art/media/brand/lazyingart-intro.gif)](https://lazying.art)

# LazyGame · Cadre d’enseignement des jeux

*Une base locale qui transforme des règles déterministes en enseignement clair et fondé sur des preuves.*

[![Website](https://img.shields.io/badge/Website-lazying.art-0EA5E9?style=flat-square)](https://lazying.art) [![CI](https://github.com/lachlanchen/LazyGame/actions/workflows/ci.yml/badge.svg)](https://github.com/lachlanchen/LazyGame/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-22C55E?style=flat-square)](../LICENSE) [![GitHub Sponsors](https://img.shields.io/badge/Sponsor-lachlanchen-EA4AAA?style=flat-square&logo=githubsponsors)](https://github.com/sponsors/lachlanchen)

LazyGame fournit des contrats réutilisables pour l’autorité, les candidats
légaux, la confidentialité, la localisation, la persistance et l’enseignement.
Chaque produit conserve son propre moteur de règles et son historique de versions.

<!-- support:start -->
[![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsors-EA4AAA?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/lachlanchen)
[![LazyingArt Support](https://img.shields.io/badge/LazyingArt-Support-0EA5E9?style=for-the-badge)](https://chat.lazying.art/donate)
[![PayPal Support](https://img.shields.io/badge/PayPal-Support-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen)
[![Stripe Support](https://img.shields.io/badge/Stripe-Support-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400)
<!-- support:end -->

## Aperçu

![Démonstration pédagogique LazyGame](../docs/images/app.png)

## Principes de conception

- Les adaptateurs déterministes possèdent les règles, actions légales, scores, informations cachées, transitions et historique rejouable.
- Chaque ID de candidat lie l’état, l’acteur et l’action ; les choix périmés ou fabriqués sont rejetés.
- Un aperçu ne modifie jamais la session et la validation reste explicite.
- Les preuves moteur et modèle sont séparées des faits exacts, calculs, conseils rédigés et analogies.
- L’interface de référence prend en charge 11 langues, dont la mise en page RTL arabe.

## Contenu

| Chemin | Rôle |
| --- | --- |
| `packages/core/` | Contrats, candidats, visibilité, i18n, sessions et rejeu |
| `packages/react/` | Composants pédagogiques accessibles et contrôleurs React |
| `apps/demo/` | Petit jeu de référence complet |
| `LazyWeiqi/` | Sous-module [LazyWeiqi](https://github.com/lachlanchen/LazyWeiqi) |
| `LazyChess/` | [LazyChess](https://github.com/lachlanchen/LazyChess) : échecs, xiangqi et shogi |
| `LazyPoker/` | [LazyPoker](https://github.com/lachlanchen/LazyPoker) : Hold'em, bridge et guandan |
| `LazyMahjong/` | Sous-module [LazyMahjong](https://github.com/lachlanchen/LazyMahjong) |

## Démarrage rapide

```bash
git clone --recurse-submodules https://github.com/lachlanchen/LazyGame.git
cd LazyGame
npm ci
npm run check
npm run app:start
```

Ouvrez <http://127.0.0.1:8011/> pour tester candidats liés, aperçus sans
mutation, confirmation explicite, preuves localisées et reprise locale sans doublon.

## Base d’architecture

Le contrat complet se trouve dans [`docs/framework-contract.md`](../docs/framework-contract.md).
La démo Web est volontairement mono-rédacteur car Web Storage ne fournit pas
de transaction multi-clé ; un déploiement multi-écriture doit sérialiser le cycle ou utiliser une base transactionnelle.

## Validation

```bash
npm run lint
npm test
npm run build
npm audit --audit-level=high
git diff --check
```

Moteurs, modèles, bases de données, profils navigateur, sessions privées et preuves d’exécution restent hors de Git.

## Citation

Si vous utilisez LazyGame en recherche, citez le dépôt. GitHub lit
[`CITATION.cff`](../CITATION.cff) et affiche **Cite this repository**.

```bibtex
@software{chen_lazygame_2026,
  author = {Chen, Lachlan},
  title = {LazyGame: Game Teaching Framework},
  year = {2026},
  url = {https://github.com/lachlanchen/LazyGame}
}
```

## État et périmètre

LazyGame est une base pédagogique et une implémentation de référence, pas un
moteur universel ni un serveur distant authentifié. Les quatre produits restent versionnés indépendamment et reliés ici comme sous-modules.
