# Fix Firebase auth errors

**ThreeDribbles project number: 329219445112**

---

## "api-key-not-found" or "Please pass a valid API key"

The key in `.env.local` may be missing, wrong, or **invalidated** (e.g. the one that was on GitHub). You need a **current** key for project 329219445112.

1. Open **Firebase Console** → project **ThreeDribbles** → **Project settings** (gear) → **General**.
2. Under **Your apps**, open your **web app** (App ID `1:329219445112:web:...`).
3. In the **config** / SDK snippet, copy the **apiKey** value.  
   If you don’t see one or it was regenerated, use that new key.
4. In `.env.local`, set `VITE_FIREBASE_API_KEY=` and paste the key (no spaces or quotes).
5. **Restart the dev server** (Vite only reads `.env.local` at startup).

If Firebase Console doesn’t show a valid key, create one in **Google Cloud Console**:  
https://console.cloud.google.com/apis/credentials?project=threedribbles-7416d  
→ **Create credentials** → **API key** → copy the key → paste into `VITE_FIREBASE_API_KEY` in `.env.local`.

---

## "Identity Toolkit API has not been used" (403)

Your app is using an API key that belongs to a **different** project (e.g. 613836604046). Use the key from **ThreeDribbles** (project 329219445112) as above.

**Or** enable the API for the project your key belongs to:

- **https://console.developers.google.com/apis/api/identitytoolkit.googleapis.com/overview?project=613836604046**  
  (Replace the project number if your error shows another one.) Click **Enable**, wait 1–2 minutes, then retry.
