GA4 Admin Integration Guide

What this adds
- Client-side measurement using Measurement IDs (`G-...`) injected per-host (already added to app layouts).
- Server-side GA Data API proxy: `GET /api/ga/data?domain=HOST` which returns realtime and 7-day reports.

Required environment variables (set in your hosting platform)
- NEXT_PUBLIC_GA_MAIN=G-XXXXXXXX  # measurement ID for techbes.co.in (client)
- NEXT_PUBLIC_GA_SKILLS=G-XXXXXXXX
- NEXT_PUBLIC_GA_MEMBERS=G-XXXXXXXX

- GA_PROPERTY_MAIN=123456789      # numeric GA4 Property ID for Data API (server)
- GA_PROPERTY_SKILLS=123456789
- GA_PROPERTY_MEMBERS=123456789

- GA_SERVICE_ACCOUNT_KEY          # full service account JSON (string) with access to GA Data API

Service account setup (brief)
1. In Google Cloud Console, create a service account in the project that owns the GA4 properties.
2. Grant the service account the role: "Analytics Data API Viewer" (or equivalent).
3. In Google Analytics (GA4) > Admin > Property Access Management, add the service account email with "Viewer" access.
4. Create & download a JSON key for the service account.
5. Copy the JSON content and store it in `GA_SERVICE_ACCOUNT_KEY` on your host (as a single-line JSON string). Do NOT commit it.

Notes
- The Data API expects numeric `propertyId` (the `properties/` id), not the `G-` measurement ID.
- The proxy endpoint uses `v1beta` of the Analytics Data API to run reports and realtime reports.
- Realtime accuracy varies; use GA Realtime in the GA UI for verification.

Next steps
- Deploy changes and set env vars on your platform (Vercel/Netlify/DigitalOcean/etc.).
- Visit the three admin pages and verify data populates:
  - /admin/analytics-main
  - /admin/analytics-skills
  - /admin/analytics-members

If you'd like, I can:
- Add authentication to restrict the API to admin users.
- Expand the proxy to return specific pre-aggregated shapes for charts (top cities, returning users, device split) and cache responses.
