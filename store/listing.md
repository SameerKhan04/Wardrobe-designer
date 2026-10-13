# Play Store listing — Wardrobe

Package `com.sameerkhan.wardrobe`. Paste the copy below into Play Console. Graphics are in `store/play/`.

## Graphics

| File | Play Console slot | Size |
| --- | --- | --- |
| `store/play/icon-512.png` | App icon | 512×512 PNG |
| `store/play/feature-1024x500.jpg` | Feature graphic | 1024×500 JPEG |
| `store/play/01-mix.jpg` | Phone screenshot 1 | 1080×1920 |
| `store/play/02-closet.jpg` | Phone screenshot 2 | 1080×1920 |
| `store/play/03-cutout.jpg` | Phone screenshot 3 | 1080×1920 |
| `store/play/04-today.jpg` | Phone screenshot 4 | 1080×1920 |
| `store/play/05-looks.jpg` | Phone screenshot 5 | 1080×1920 |

Upload screenshots in that order: Mix, Closet, cutout, Today, Looks.

## Store listing

**App name**

Wardrobe

**Short description** (54 characters, limit 80)

Photograph your clothes. Lock a row, shuffle the rest.

**Full description**

Wardrobe is a closet that works like a slot machine.

Photograph a piece laid flat. The app cuts it out on your phone and files it as a top, bottom, shoes, jacket, or dress. Lock the rows you already like and shuffle the rest. Save a look. Ask what to wear for a temperature, and for rain.

What you can do

- Photograph clothes, or pick a photo, and keep a cutout
- Mix tops, bottoms, and shoes, and add a jacket when you want one
- Lock a row so Shuffle leaves it alone
- Wear a dress and the bottoms row steps aside
- Mark a piece as in the laundry and it drops out of the mix
- Get outfit ideas for the temperature and the rain
- Tap “Use where I am” for a one-time weather check, or set it yourself
- Save looks and tag them Work, Casual, Date Night, or Gym
- Keep everything on this phone
- Sign in only if you want the same closet on another phone
- Delete your account in the app. The cloud copy and the phone copy both go

Wardrobe does not show ads, and it does not sell your photos.

## Privacy policy URL

After this repo is pushed and GitHub Pages is on (branch `main`, folder `/docs`):

https://sameerkhan04.github.io/Wardrobe-designer/

The page is `docs/index.html`.

## Data safety (match the policy)

Answer from how the app actually behaves.

- **Ads:** no
- **Data sold:** no
- **Analytics / crash SDKs:** none in the app
- **Encryption in transit:** yes (HTTPS for weather and, if used, account sync)
- **Users can request deletion:** yes. In the app: You → Delete my account. That removes the Supabase account, closet rows, private photos, and the local closet.
- **Account optional:** yes. The app works with no sign-in. Email is collected only if the user creates an account.

| Data | Collected | Shared off the phone | Stored | Notes |
| --- | --- | --- | --- | --- |
| Photos | Yes | Only if the user signs in | On device; private Supabase folder when signed in | Clothing photos the user takes or picks. Cutout runs on device (ML Kit). Not used for ads. |
| Email | Only with an account | Supabase Authentication | Supabase | Password is handled by Supabase, not by a custom server. |
| Precise location | Only when the user taps “Use where I am” | Sent once to api.open-meteo.com | Coordinates are not stored | Foreground, one shot. No background location. The phone keeps the resulting temperature and rain yes/no only. |
| Approximate location | Same as precise | Same request | Not stored | The manifest includes coarse and fine location; both are used only for that tap. |

Do not declare financial info, contacts, SMS, audio, web browsing, or device advertising IDs. The app does not collect them.

## Before you submit

1. Commit and push `docs/` so the privacy URL loads in a browser. Play rejects a policy that 404s.
2. In the GitHub repo: Settings → Pages → Deploy from branch → `main` → `/docs`.
3. If you want an email on the policy, add it to the Contact section of `docs/index.html` before you submit. The page currently points people to GitHub issues.
4. In Play Console, set the privacy policy URL to the Pages link above, and make the Data safety form match the table.
