# 07 — How the apps and website should feel

## Mobile (source of daily use)

Five tabs in v1. City is still the homepage — not a card stack.

1. **City** — this week in Istanbul, next Friday
2. **Events** — full list, RSVP, door tools
3. **Feed** — city posts, no swipe
4. **Venues** — Iranian places
5. **Me** — profile, safety, pause. Handwritten verification uploads on the website.

No card stack. No lightning Boost. RTL when locale is `fa`. Dates are **Gregorian (Istanbul)**, never Jalali — Persian weekday names, Miladi day/month.

Visual: tea-stained paper, cream cards, copper-pomegranate action (`#B12E28`), saffron only on the verified-human badge. Cafe in Karaköy, not a neon dating brand. No drop shadows, no swipe chrome.

Type: **Markazi Text** for headlines and «دورهم», **Vazirmatn** for body/UI, **Fraunces** for the Latin wordmark. Dates Gregorian. RTL.

Onboarding: city (Istanbul locked), language (FA/EN), name, photo, “I am 18+”. Dating opt-in is a later settings switch, off by default.

## Website (source of trust + SEO)

The website is not a second Tinder. It is:

1. Why Dorham exists
2. Next Istanbul event (public, shareable)
3. Download App Store / Play
4. Safety, community rules, privacy, terms
5. Language toggle FA / EN

People coming from Instagram should land on **an event URL**, not a login wall.

Later: ticket checkout on web for users who refuse to install.

## Admin

No admin app in phase 0. Hosts are flagged in DB. Review verification in Prisma Studio until volume hurts.

## Store listing

One Expo app. iOS and Android share the same TypeScript UI. Native shells only differ for icons, splash, and store metadata.

| Field | Value |
| --- | --- |
| Name | Dorham |
| Persian | دورهم |
| Subtitle | Iranian community in Turkey |
| Category | Social Networking — never Dating in v1 |
| Age | 17+ (product rule is 18+; register requires the checkbox) |
| Bundle / package | `app.dorham.mobile` |
| Privacy | https://dorham.app/privacy |
| Terms | https://dorham.app/terms |
| Support | https://dorham.app/safety |
| Account deletion | In-app: Me → حذف حساب. Also required on store forms. |
| Tracking | None. No ATT. No advertising ID. |
| Permissions | None beyond network + secure session. No camera, photos, location, contacts, microphone. |

### Review notes

- Homepage is the city and events, not cards.
- Tickets are cash at the door until Iyzico.
- Verification photos stay off the public profile.
- Iran is not a launch market.

### Build

```
cd apps/mobile
npx eas build --platform all --profile production
```
