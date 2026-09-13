# 08 — Real data policy

Dorham shows **real places and real gatherings**. Seed data must not invent a scene that does not exist.

## Allowed in seed / fixtures

- Istanbul venues that exist as public businesses (address + **Google Maps URL** + lat/lng pin)
- Map previews from the same coordinates (Google Static if `GOOGLE_MAPS_API_KEY` is set, else OSM tiles)
- **Real venue photos** when rights are clear: owner/community upload (admin-approved) or curated HTTPS URLs of that place. Prefer photos over map tiles on cards. Do not invent stock food photos.
- One local **dev admin** account for login (`host@dorham.app`) — clearly a tooling account, not a public persona
- **CITY_SHOW** calendar rows: public concert/show facts (artist, date, venue name) + outbound ticket link. Dorham does not sell arena tickets and does not copy third-party marketing copy.
- A small number of **COMMUNITY** Dorham gathers at real Iranian venues (RSVP + door) so the city page is not empty at soft-launch

## Not allowed

- Fabricating attendance counts or “sold out” theater for CITY_SHOW
- Fake feed posts that imply a live community calendar without hosts
- Fake nearby profiles, Boost-style decoys, or invented venue hours presented as verified fact
- Cloning IrConcerts (or any ticket reseller) as Dorham’s product identity
- Using `dorham.com` as if we own it (we do not; see `06-naming.md`)

## Copy rules

- Venue blurbs describe the **place**, not a fictional Dorham meetup that already happened there
- UI empty states must say the city has no published events yet — never inject demo cards in production builds
- If a phone / hour / URL is uncertain, omit it rather than guess

## Production

Only events created by verified hosts through the API appear on the city home. Re-seed on a server must not reintroduce demo gatherings.
