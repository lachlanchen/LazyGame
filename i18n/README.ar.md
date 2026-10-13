[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner — apps and four buddies](https://github.com/lachlanchen/LazyingArtWebsite/raw/main/media/brand/lazyingart-intro.gif)](https://lazying.art)

# LazyGame · إطار تعليم الألعاب

*أساس محلي أولًا يحوّل قواعد الألعاب الحتمية إلى تعليم واضح قائم على الأدلة.*

[![Website](https://img.shields.io/badge/Website-lazying.art-0EA5E9?style=flat-square)](https://lazying.art) [![CI](https://github.com/lachlanchen/LazyGame/actions/workflows/ci.yml/badge.svg)](https://github.com/lachlanchen/LazyGame/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-22C55E?style=flat-square)](../LICENSE) [![GitHub Sponsors](https://img.shields.io/badge/Sponsor-lachlanchen-EA4AAA?style=flat-square&logo=githubsponsors)](https://github.com/sponsors/lachlanchen)

يوفّر LazyGame عقودًا قابلة لإعادة الاستخدام للسلطة، والاختيارات القانونية،
وحجب المعلومات، والترجمة، والحفظ، والتعليم. تحتفظ كل لعبة بمحرك قواعدها
وتاريخ إصدارها المستقلين.

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

## المعاينة

![عرض LazyGame التعليمي](../docs/images/app.png)

## مبادئ التصميم

- تمتلك المحولات الحتمية القواعد والحركات القانونية والنتائج والمعلومات المخفية والسجل القابل للإعادة.
- ترتبط هوية كل اقتراح بالحالة واللاعب والفعل؛ وتُرفض الاختيارات القديمة أو المصطنعة.
- المعاينة لا تغيّر الجلسة، والتأكيد صريح دائمًا.
- تُفصل أدلة المحرك والنموذج عن الحقائق الدقيقة والحساب والإرشاد والتشبيه.
- تدعم الواجهة المرجعية 11 لغة، ومنها تخطيط عربي من اليمين إلى اليسار.

## محتويات مساحة العمل

| المسار | الغرض |
| --- | --- |
| `packages/core/` | العقود والاختيارات والرؤية والترجمة والجلسات والإعادة |
| `packages/react/` | مكوّنات تعليمية ميسّرة ووحدات تحكم React |
| `apps/demo/` | لعبة مرجعية صغيرة مكتملة |
| `LazyWeiqi/` | وحدة [LazyWeiqi](https://github.com/lachlanchen/LazyWeiqi) الفرعية |
| `LazyChess/` | [LazyChess](https://github.com/lachlanchen/LazyChess): الشطرنج والشطرنج الصيني والشوغي |
| `LazyPoker/` | [LazyPoker](https://github.com/lachlanchen/LazyPoker): هولدم والبريدج وقواندان |
| `LazyMahjong/` | وحدة [LazyMahjong](https://github.com/lachlanchen/LazyMahjong) الفرعية |

## بدء سريع

```bash
git clone --recurse-submodules https://github.com/lachlanchen/LazyGame.git
cd LazyGame
npm ci
npm run check
npm run app:start
```

افتح <http://127.0.0.1:8011/> لرؤية الاقتراحات المقيّدة والمعاينة غير
المغيّرة والتأكيد الصريح والأدلة المترجمة والاستئناف المحلي بلا تكرار.

## الأساس المعماري

العقد الكامل في [`docs/framework-contract.md`](../docs/framework-contract.md).
العرض في المتصفح أحادي الكاتب عمدًا لأن Web Storage لا يوفّر معاملة متعددة
المفاتيح؛ يجب أن تستخدم التطبيقات متعددة النوافذ تسلسلًا خارجيًا أو قاعدة بيانات معاملية.

## التحقق

```bash
npm run lint
npm test
npm run build
npm audit --audit-level=high
git diff --check
```

تبقى المحركات والنماذج وقواعد البيانات وملفات المتصفح والجلسات الخاصة وأدلة التشغيل خارج Git.

## الاستشهاد

إذا استخدمت LazyGame في بحث، فاستشهد بالمستودع. يقرأ GitHub ملف
[`CITATION.cff`](../CITATION.cff) ويعرض لوحة **Cite this repository**.

```bibtex
@software{chen_lazygame_2026,
  author = {Chen, Lachlan},
  title = {LazyGame: Game Teaching Framework},
  year = {2026},
  url = {https://github.com/lachlanchen/LazyGame}
}
```

## الحالة والنطاق

LazyGame أساس تعليمي وتنفيذ مرجعي، وليس محرك قواعد شاملًا ولا خادم ألعاب
بعيدة موثّقًا. تبقى المنتجات الأربعة مستقلة الإصدارات وترتبط هنا كوحدات فرعية.
