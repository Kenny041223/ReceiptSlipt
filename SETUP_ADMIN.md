# Setup: Login Gate, Scan Limits & Admin

The app now **requires sign-in**, gives each user **20 scans by default**, blocks them
with a "contact admin" popup when they run out, and gives **you** an admin dashboard at
`/admin` to view usage and raise individual limits.

Scan counting happens on the **server** (Firebase Admin SDK) so users can't cheat it.
Three setup steps are needed.

---

## 1. Generate a Firebase service account key

1. Firebase Console → **⚙️ Project settings** → **Service accounts** tab
2. Click **Generate new private key** → confirm → a `.json` file downloads
3. **Keep this file secret** — it grants full admin access to your project. Never commit it.

## 2. Base64-encode the key and add env vars

The key is multi-line JSON, so we store it base64-encoded in a single env var.

In PowerShell, run this (replace the path with where your downloaded `.json` lives):

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("$env:USERPROFILE\Downloads\your-key-file.json"))
```

Copy the long string it prints. Then add these to **`.env.local`** (local) **and** to
**Vercel → Settings → Environment Variables** (production):

| Variable | Value |
|----------|-------|
| `FIREBASE_SERVICE_ACCOUNT_KEY` | the base64 string from above |
| `ADMIN_EMAILS` | your email (the one you log in with) — comma-separate for multiple admins |
| `NEXT_PUBLIC_CONTACT_EMAIL` | the email users should contact for more scans |

> After adding env vars on Vercel, **redeploy** for them to take effect.

## 3. Lock down Firestore rules

So users can't edit their own scan count/limit directly:

1. Firebase Console → **Firestore Database** → **Rules** tab
2. Replace everything with the contents of [`firestore.rules`](firestore.rules)
3. Click **Publish**

---

## How it works

- **Default limit:** 20 scans/user (change `DEFAULT_SCAN_LIMIT` in `lib/apiAuth.ts`)
- **Admins** (emails in `ADMIN_EMAILS`): unlimited scans + see the **Admin** link in the header
- **Admin dashboard** (`/admin`): lists every user, their usage, and lets you change each
  person's limit or reset their count to 0
- A user's count only increases on a **successful** scan (failed/blurry scans aren't charged)
