# Translation Tool

Công cụ dịch tiếng Anh sang tiếng Việt bằng provider tương thích OpenAI API, chạy trên Electron + Svelte.

## Tính năng

- Dịch tiếng Anh sang tiếng Việt
- Phím tắt toàn cục để dịch text đã chọn
- Hỗ trợ OpenAI và các provider tương thích OpenAI API qua `.env`
- Cấu hình `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL` qua `.env`
- Request dịch chỉ chạy qua Electron main process

## Cài đặt

1. Cài dependencies:

```bash
npm install
```

2. Tạo file `.env` từ mẫu:

```bash
cp .env.example .env
```

3. Cập nhật `.env`:

```env
OPENAI_API_KEY=your_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-3.5-turbo
```

App hỗ trợ mọi provider tương thích OpenAI API. Chỉ cần đổi `OPENAI_BASE_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL` theo provider bạn đang dùng.

Ví dụ:

### OpenAI

```env
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-3.5-turbo
```

### OpenRouter

```env
OPENAI_API_KEY=sk-or-...
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=openai/gpt-4o-mini
```

### Local / self-hosted OpenAI-compatible API

```env
OPENAI_API_KEY=dummy
OPENAI_BASE_URL=http://127.0.0.1:1234/v1
OPENAI_MODEL=your-local-model
```

Lưu ý:

- `OPENAI_BASE_URL` nên là base URL có `/v1`
- `OPENAI_MODEL` phải đúng tên model mà provider hỗ trợ
- Nếu provider không bắt buộc API key, vẫn cần điền `OPENAI_API_KEY` khác rỗng vì app hiện yêu cầu biến này

## Chạy ứng dụng

### Development

```bash
npm run electron:dev
```

### Build

```bash
npm run electron:build
```

## Settings

Tab Settings chỉ còn dùng để:

- đổi phím tắt
- kiểm tra Accessibility permission trên macOS
