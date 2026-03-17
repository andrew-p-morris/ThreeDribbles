# Cost tracking – Three Dribbles

Keep a running log of costs and limits here. Update the tables as you get bills or change plans.

---

## Firebase (primary backend)

| Item | Plan / limit | Your usage / cost | Notes |
|------|----------------|-------------------|--------|
| **Auth** | Spark: 10K verifications/mo free | | [Pricing](https://firebase.google.com/pricing) |
| **Firestore** | Spark: 50K reads, 20K writes, 20K deletes/day | | Monitor in Firebase Console → Usage |
| **Firestore** | Blaze: pay-as-you-go after free tier | | Enable only if you need more |
| **Hosting** | Spark: 10 GB storage, 360 MB/day transfer | | If you use Firebase Hosting |
| **Realtime Database** | Not used yet (README: "planned") | — | Add row if you enable it |

**Monthly log (optional)**  
| Month | Auth | Firestore | Hosting | Total | Notes |
|-------|------|-----------|---------|--------|--------|
| 2025-03 | — | — | — | $0 | Spark free tier |
| | | | | | |

---

## Other services (add when you use them)

| Service | Purpose | Cost / limit | Log |
|---------|---------|----------------|-----|
| **Stripe** | Coins / shop (planned) | % + fixed per transaction | Add when you enable |
| **Domain** | Custom domain (optional) | ~$10–15/yr | |
| **Vercel / Netlify / etc.** | Alternative to Firebase Hosting | Free tier or paid | |

---

## Quick reference

- **Firebase Console** → [Usage and billing](https://console.firebase.google.com/project/threedribblesnew/usage).
- **Set budget alerts** in [Google Cloud Billing](https://console.cloud.google.com/billing) for the project so you get notified before surprise charges (Blaze only).
