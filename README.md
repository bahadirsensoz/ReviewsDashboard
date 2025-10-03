# Flex Living Reviews Dashboard

## Overview
Flex Living managers use this console to monitor guest sentiment, spot operational issues, and curate testimonials for the brand website. The experience consumes Hostaway review data when credentials are present and automatically falls back to the staged dataset so the UI remains fully interactive.

## Tech Stack
- Next.js 15 · React 19 · TypeScript
- Tailwind CSS for styling and motion
- Local storage for manager approvals
- Fetch API on the server for Hostaway integration

## Environment & Configuration
Create a `.env.local` file before running the app:

```
HOSTAWAY_ACCOUNT_ID=61148
HOSTAWAY_API_KEY=f94377ebbbb479490bb3ec364649168dc443dda2e4830facaf5de2e74ccc9152
# Optional overrides
# HOSTAWAY_API_BASE=https://api.hostaway.com
# HOSTAWAY_REVIEWS_ENDPOINT=/v1/reviews
# Development-only toggle to log Hostaway calls
# NEXT_PUBLIC_DEBUG_HOSTAWAY=true
```

If the Hostaway sandbox rejects the request (403 or downtime) the API route gracefully falls back to the staged dataset and surfaces that context inside the dashboard.

## Getting Started
1. Install packages: `npm install`
2. Run the dev server: `npm run dev`
3. Visit `http://localhost:3000` for the operations dashboard
4. Open `http://localhost:3000/properties/101` (or `202`, `303`) to preview the customer-facing page

Lint the project with `npm run lint`.

## Key Application Flows
- **Dashboard (`/`)** – Aggregates Hostaway reviews per listing, exposes filtering (channel, category, rating threshold, search, date), highlights focus areas, and allows managers to approve which reviews go live. A data-source badge shows whether content is live from Hostaway or the staged dataset.
- **Property Page (`/properties/[listingId]`)** – Mirrors the Flex Living property layout with hero imagery, amenity callouts, sentiment highlights, and only the reviews approved in the dashboard.
- **API Route (`GET /api/reviews/hostaway`)** – Normalises Hostaway responses, enriches them with averages, distributions, and time-series data. The JSON includes the active filters, data source, and any upstream error message for transparency.

## Data Pipeline
- `src/lib/hostaway-client.ts` calls the Hostaway Reviews endpoint with the supplied credentials and masks them in dev logs.
- `src/lib/hostaway.ts` filters, normalises, and annotates review data (source, summaries, category averages, rating distributions, and time series).
- `src/data/hostaway-mock.ts` keeps the staged dataset aligned with the Hostaway schema so the UI remains usable without external dependencies.

## UX Details
- Dashboard summary chips, insights panels, and review toggles present the most actionable data first.
- The property page surfaces sentiment highlights, trust messaging, and CTA copy to feel production ready.
- A global gradient background, metadata, and typography upgrades bring brand consistency.
- Local storage persists review approvals, and the dashboard indicates sync status so managers know when selections are ready.

## Google Reviews Exploration
Direct Google Places integration was explored but not implemented because the assessment environment does not expose Place IDs or billing-enabled credentials. Future work could:
1. Store Place IDs with each listing
2. Add a server route (e.g. `GET /api/reviews/google`) that fetches and normalises Google reviews
3. Cache responses (Redis/S3/edge) to respect quota and Google’s freshness rules

## Future Enhancements
- Persist approvals in a shared datastore (DynamoDB, PostgreSQL, or Hostaway custom fields)
- Display sparkline or radar charts for categories once a charting library is approved
- Add multi-portfolio support with role-based access control
- Schedule nightly Hostaway sync jobs and surface deltas in the dashboard
