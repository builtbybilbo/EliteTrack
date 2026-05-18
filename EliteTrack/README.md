# Élite Track — Performance Engineering

Premium workout tracking app with progressive overload engine, coach portal, and muscle heatmap.

## Features
- **Coach login** — manage athletes, assign programmes, set exercises
- **Athlete portal** — PIN-protected access per client
- **Progressive overload** — auto-calculates next session weights
- **Muscle heatmap** — anterior/posterior body map showing coverage
- **PB tracking** — personal best records with gold shimmer animations
- **Anime watercolour** — Toji-inspired background figure
- **Smooth transitions** — fade/scale animations between all views

## Demo credentials
| Role | Username | Password/PIN |
|------|----------|-------------|
| Coach | `coach` | `elite2024` |
| James Harrington | — | `1234` |
| Sofia Marchetti | — | `5678` |

## Local development

```bash
npm install
npm run dev
```

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import your GitHub repo
4. Vercel auto-detects Vite — just click **Deploy**

No environment variables required. Data persists in the browser via localStorage.
