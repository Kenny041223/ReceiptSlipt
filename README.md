# Tally — Receipt Splitter

Tally is a Next.js app for scanning a receipt, extracting its items, assigning each item to friends, and calculating who owes what. Authentication, scan limits, user history, and the admin dashboard use Firebase.

## Receipt scanning with Hugging Face

Receipt images are sent only from the server to the [Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) OpenAI-compatible chat-completions endpoint. By default, the app uses `Qwen/Qwen2.5-VL-7B-Instruct`, an Apache-2.0 vision-language model. It returns structured JSON for purchasable receipt items; server-side validation then rejects malformed names, quantities, and prices before the user sees the editable item list.

The Hugging Face token stays on the server: the browser uploads an image only to `/api/ocr`, which verifies the Firebase user and then calls Hugging Face. Do not expose this token with a `NEXT_PUBLIC_` prefix.

## Setup

1. Install dependencies and copy the environment template:

   ```bash
   npm install
   cp .env.local.example .env.local
   ```

2. Create a Hugging Face fine-grained token with **Inference Providers** permission at [Hugging Face Tokens](https://huggingface.co/settings/tokens), then set it in `.env.local`:

   ```env
   HF_TOKEN=hf_your_token
   ```

   The default model is `Qwen/Qwen2.5-VL-7B-Instruct`. To choose another compatible vision model, set `HUGGINGFACE_OCR_MODEL`. If your account requires a specific inference provider, use its Hugging Face model identifier with the provider suffix.

3. Fill in the Firebase web and Admin SDK variables in `.env.local`. See [SETUP_ADMIN.md](./SETUP_ADMIN.md) for Firebase setup, admins, and scan quotas.

4. Start the development server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `HF_TOKEN` | Yes | Server-only Hugging Face Inference Providers token. |
| `HUGGINGFACE_OCR_MODEL` | No | Vision model used for structured receipt extraction. Defaults to `Qwen/Qwen2.5-VL-7B-Instruct`. |
| `NEXT_PUBLIC_FIREBASE_*` | Yes | Firebase client configuration. |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Yes | Base64-encoded Firebase service-account JSON for server routes. |
| `ADMIN_EMAILS` | No | Comma-separated email addresses with unlimited scans and admin access. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | No | Contact shown when a user reaches their scan quota. |

## Notes

- The Hugging Face provider and model determine the available quota and billing; the app does not assume a fixed free-scan allowance.
- Each successful scan is counted in Firebase. Administrators can review monthly volume and set per-user scan limits from `/admin`.
- The model is instructed to ignore payment and footer lines such as `Tender`, `Change`, discounts, and QR-code text. Clear, upright receipt photos give the most reliable extraction; users can always correct the result before splitting the bill.
