# 08 — Real data policy

Dorham shows **real places and real gatherings**. Seed data must not invent a scene that does not exist.

## Allowed in seed / fixtures

- Istanbul venues that exist as public businesses (address + **Google Maps URL** + lat/lng pin)
- Map previews from the same coordinates (Google Static if `GOOGLE_MAPS_API_KEY` is set, else OSM tiles)
- One local **dev admin** account for login (`host@dorham.app`) — clearly a tooling account, not a public persona
- Empty events / feed lists until a real host publishes

## Not allowed

- Fabricated “this Friday” events with made-up capacity, price, or attendance
- Fake feed posts that imply a live community calendar
- Fake nearby profiles, Boost-style decoys, or invented venue hours presented as verified fact
- Using `dorham.com` as if we own it (we do not; see `06-naming.md`)

## Copy rules

- Venue blurbs describe the **place**, not a fictional Dorham meetup that already happened there
- UI empty states must say the city has no published events yet — never inject demo cards in production builds
- If a phone / hour / URL is uncertain, omit it rather than guess

## Production

Only events created by verified hosts through the API appear on the city home. Re-seed on a server must not reintroduce demo gatherings.
