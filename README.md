# ORB / JUST US

Teaser site for downloadable WebXR musician orbs and a New Year’s Eve global concert. Community proposals and votes live on a Neon-backed leaderboard; industry veterans confirm final performers.

## Setup

```bash
cp .env.example .env.local
# set DATABASE_URL, ADMIN_KEY, VOTE_COOKIE_SECRET
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Routes

| Path | Purpose |
|------|---------|
| `/` | Teaser + globe |
| `/leaderboard` | Confirmed acts + ranked proposals |
| `/artists/signup` | Artist self-nomination |
| `/recommend` | Recommend or vote |
| `/admin` | Staff confirm / hide (admin key) |

## Scripts

- `npm run dev` — development server
- `npm run build` / `npm start` — production
