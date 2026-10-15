[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner — apps and four buddies](https://lazying.art/media/brand/lazyingart-intro.gif)](https://lazying.art)

# LazyGame · Khung dạy trò chơi

*Nền tảng ưu tiên cục bộ biến luật tất định thành bài dạy rõ ràng, có căn cứ.*

[![Website](https://img.shields.io/badge/Website-lazying.art-0EA5E9?style=flat-square)](https://lazying.art) [![CI](https://github.com/lachlanchen/LazyGame/actions/workflows/ci.yml/badge.svg)](https://github.com/lachlanchen/LazyGame/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-22C55E?style=flat-square)](../LICENSE) [![GitHub Sponsors](https://img.shields.io/badge/Sponsor-lachlanchen-EA4AAA?style=flat-square&logo=githubsponsors)](https://github.com/sponsors/lachlanchen)

LazyGame cung cấp các hợp đồng dùng lại cho thẩm quyền, ứng viên hợp lệ, che dữ liệu,
bản địa hóa, lưu trữ và giảng dạy. Mỗi sản phẩm giữ bộ luật và lịch sử phát hành riêng.

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

## Xem trước

![Bản trình diễn dạy học LazyGame](../docs/images/app.png)

## Nguyên tắc thiết kế

- Bộ điều hợp tất định sở hữu luật, hành động hợp lệ, điểm số, dữ liệu ẩn, chuyển trạng thái và lịch sử phát lại.
- ID ứng viên ràng buộc trạng thái, tác nhân và hành động; lựa chọn cũ hoặc giả bị từ chối.
- Xem trước không sửa phiên và xác nhận luôn rõ ràng.
- Bằng chứng máy/model tách khỏi sự kiện chính xác, phép tính, hướng dẫn biên soạn và phép ví von.
- Giao diện mẫu hỗ trợ 11 ngôn ngữ, gồm bố cục RTL cho tiếng Ả Rập.

## Không gian làm việc

| Đường dẫn | Mục đích |
| --- | --- |
| `packages/core/` | Hợp đồng, ứng viên, khả năng nhìn, i18n, phiên và phát lại |
| `packages/react/` | Thành phần dạy học dễ tiếp cận và bộ điều khiển React |
| `apps/demo/` | Trò chơi mẫu nhỏ nhưng hoàn chỉnh |
| `LazyWeiqi/` | Submodule [LazyWeiqi](https://github.com/lachlanchen/LazyWeiqi) |
| `LazyChess/` | [LazyChess](https://github.com/lachlanchen/LazyChess): cờ vua, cờ tướng và shogi |
| `LazyPoker/` | [LazyPoker](https://github.com/lachlanchen/LazyPoker): Hold'em, bridge và guandan |
| `LazyMahjong/` | Submodule [LazyMahjong](https://github.com/lachlanchen/LazyMahjong) |

## Bắt đầu nhanh

```bash
git clone --recurse-submodules https://github.com/lachlanchen/LazyGame.git
cd LazyGame
npm ci
npm run check
npm run app:start
```

Mở <http://127.0.0.1:8011/> để xem ứng viên ràng buộc trạng thái, xem trước
không đột biến, xác nhận rõ ràng, bằng chứng đã dịch và tiếp tục cục bộ không trùng.

## Nền tảng kiến trúc

Hợp đồng đầy đủ nằm tại [`docs/framework-contract.md`](../docs/framework-contract.md).
Demo trình duyệt cố ý chỉ có một bên ghi vì Web Storage không có giao dịch nhiều khóa;
triển khai nhiều bên ghi phải tuần tự hóa vòng đời hoặc dùng cơ sở dữ liệu giao dịch.

## Kiểm tra

```bash
npm run lint
npm test
npm run build
npm audit --audit-level=high
git diff --check
```

Engine, model, cơ sở dữ liệu, hồ sơ trình duyệt, phiên riêng và bằng chứng chạy luôn nằm ngoài Git.

## Trích dẫn

Nếu dùng LazyGame trong nghiên cứu, hãy trích dẫn kho mã. GitHub đọc
[`CITATION.cff`](../CITATION.cff) và hiển thị **Cite this repository**.

```bibtex
@software{chen_lazygame_2026,
  author = {Chen, Lachlan},
  title = {LazyGame: Game Teaching Framework},
  year = {2026},
  url = {https://github.com/lachlanchen/LazyGame}
}
```

## Trạng thái và phạm vi

LazyGame là nền tảng dạy học và bản triển khai tham chiếu, không phải engine luật
phổ quát hay máy chủ từ xa có xác thực. Bốn sản phẩm giữ phiên bản độc lập và được liên kết bằng submodule.
