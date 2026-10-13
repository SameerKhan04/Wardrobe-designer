# Wardrobe

A Clueless-style digital closet for Android (iPhone later from the same code). Photograph clothes flat, get an on-device cutout, then mix tops, bottoms, shoes and an optional jacket in slot-machine rows. Lock what you like, shuffle the rest, save looks, and get outfit suggestions for any temperature and rain. Runs fully on the phone; optional free Supabase sync for a handful of people.

Expo SDK 57, React Native, TypeScript, SQLite on device, Supabase (free tier) for accounts, sync and photos.

## Run it

```bash
npm install
npm test                  # logic tests (mixer, suggestions, sync, weather, crop)
npx expo run:android      # needs Android Studio (SDK + a phone or emulator); builds a dev client
```

The cutout uses a native module (ML Kit), so Expo Go cannot run this app. You need the build above.

## Turn on cloud sync (optional, free)

Without this the app works on one phone with no accounts.

1. Create a project at supabase.com (Free plan).
2. SQL editor: run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql). It creates the tables, row-level security, and the private `garments` bucket.
3. Authentication > Providers > Email: turn **off** "Confirm email" (the free mailer is rate-limited and six people do not need it).
4. Deploy the delete-account function (required for in-app account deletion):
   `npx supabase login`, `npx supabase link --project-ref <ref>`, `npx supabase functions deploy delete-account`
5. `copy .env.example .env` and fill `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (Project Settings > API). Rebuild.

The free plan pauses a project after a week with no activity. The app keeps working from its on-phone copy; restore the project in the Supabase dashboard and the next sync catches up.

## Hand the app to friends

`npx expo run:android --variant release` produces an APK under `android/app/build/outputs/apk/release/`. Send the file; no Play Store needed. A Play listing costs a one-time $25 and also needs a store listing, privacy policy URL and a real upload key; the app is already built for that (no broad storage permission, in-app account deletion, foreground-only location).

## Check on a real phone

These cannot be verified without a device, so do them once after the first build:

1. Add five flat-lay items (a tee, trousers, shoes, a jacket, a dress). The cutout should leave a recognisable garment (rough edges are fine). If it fails, the photo is kept and "Try cutout again" appears; the first try can fail while Google downloads the model.
2. Mix: lock the bottoms row, Shuffle, confirm only the other rows change. Pick the dress and the bottoms row should collapse. Toggle the jacket on and off.
3. Today: set 8 degrees + Rain and 28 degrees + No rain. Mark one item "In laundry" and confirm it disappears from Mix and Today.
4. With sync on: sign in on a second phone and confirm the closet and pictures arrive. Airplane mode: browse and edit, then reconnect.
5. Delete account: the cloud rows and files, and the local closet, are gone.

## Layout

- `src/core/` pure logic with tests: mixer (lock/shuffle/repair), suggestions, last-write-wins sync plan, weather parsing, crop maths
- `src/data/` SQLite (`db.ts`), image files, Supabase sync and auth (`cloud.ts`)
- `src/features/process.ts` photo to square to cutout to 800px image
- `src/app/` screens (Expo Router): Mix, Closet, Today, Looks, You, add item, edit item
- `supabase/` SQL migration and the delete-account Edge Function
- `scripts/make-icons.mjs` regenerates the app icons

## Known limits

- Sync is last-write-wins by the phone's clock; a badly wrong clock can overwrite a newer edit.
- Cutout edges can be rough, and there is no baked drop shadow (items sit on a card instead).
- Suggestions are rules (warmth, rain, formality band, no same-colour top and bottom), not a stylist.
