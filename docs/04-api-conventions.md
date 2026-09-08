# 04 — API conventions

Base: `{API_URL}/v1`

## Envelope

Success (single resource):

```json
{ "data": { } }
```

Success (list):

```json
{
  "data": [],
  "page": { "nextCursor": null, "limit": 20 }
}
```

Error:

```json
{
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Email or password is wrong.",
    "details": null,
    "requestId": "uuid"
  }
}
```

## Status codes

| Code | When |
| --- | --- |
| 200 | Read / update |
| 201 | Create |
| 204 | Logout / delete with empty body |
| 400 | Zod validation |
| 401 | Missing / bad token |
| 403 | Authenticated but not allowed |
| 404 | Not found (do not leak whether email exists on login) |
| 409 | Unique conflict (email taken) |
| 429 | Rate limit |
| 500 | Unexpected — no stack in body |

## Auth header

`Authorization: Bearer <accessToken>`

Refresh is a body token, not a JS-readable cookie on mobile. Web may later use httpOnly cookies; do not mix both in v1.

## Resources

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/v1/health` | no | liveness |
| GET | `/v1/health/ready` | no | Postgres + Redis |
| POST | `/v1/auth/register` | no | create user |
| POST | `/v1/auth/login` | no | tokens |
| POST | `/v1/auth/refresh` | no | rotate refresh |
| POST | `/v1/auth/logout` | yes | revoke session |
| POST | `/v1/auth/verify-email` | no | consume email token |
| POST | `/v1/auth/resend-verification` | yes | new email token |
| GET | `/v1/users/me` | yes | self |
| PATCH | `/v1/users/me` | yes | profile |
| POST | `/v1/users/me/photo` | yes | attach profile photo |
| POST | `/v1/users/me/pause` | yes | pause |
| POST | `/v1/users/me/resume` | yes | resume |
| DELETE | `/v1/users/me` | yes | anonymize + revoke |
| GET | `/v1/users/me/verification` | yes | own verify status |
| POST | `/v1/users/me/verification` | yes | submit handwritten photo |
| GET | `/v1/users/me/blocks` | yes | block list |
| GET | `/v1/users/:id` | optional | public profile (hidden if paused) |
| POST | `/v1/users/:id/block` | yes | block |
| DELETE | `/v1/users/:id/block` | yes | unblock |
| POST | `/v1/reports` | yes | report a person |
| POST | `/v1/media` | yes | multipart `file` + `kind` |
| GET | `/v1/media/:id` | signed query | profile photos. Verification photos also need owner or staff JWT |
| GET | `/v1/admin/verifications` | moderator+ | verify queue |
| POST | `/v1/admin/verifications/:id/review` | moderator+ | approve / reject |
| GET | `/v1/venues` | no | Iranian places in a city |
| GET | `/v1/venues/:id` | no | slug or id |
| GET | `/v1/feed` | optional | city posts, newest first |
| POST | `/v1/feed` | host+ or verified | create a city post |
| GET | `/v1/feed/:id` | optional | one post |
| GET | `/v1/feed/:id/comments` | optional | comments |
| POST | `/v1/feed/:id/comments` | yes | comment |
| POST | `/v1/feed/:id/report` | yes | report a post |
| DELETE | `/v1/feed/:id` | author or mod | hide a post |
| GET | `/v1/events` | no | public published list |
| POST | `/v1/events` | host+ | create |
| GET | `/v1/events/:id` | no | public detail |
| GET | `/v1/events/:id/guests` | optional | names + going; ticket fields only if signed in |
| POST | `/v1/events/:id/rsvp` | yes | going or waitlist |
| DELETE | `/v1/events/:id/rsvp` | yes | cancel; promotes waitlist |
| GET | `/v1/events/:id/door` | host+ | check-in URL for QR |
| POST | `/v1/events/:id/checkin` | yes | `{ secret }` self or `{ userId }` host |

## Error codes (stable)

`VALIDATION_FAILED` `AUTH_INVALID_CREDENTIALS` `AUTH_EMAIL_TAKEN` `AUTH_LOCKED` `AUTH_UNAUTHORIZED` `AUTH_FORBIDDEN` `AUTH_EMAIL_TOKEN_INVALID` `AUTH_ACCOUNT_PAUSED` `AUTH_ACCOUNT_SUSPENDED` `EVENT_NOT_FOUND` `EVENT_FULL` `EVENT_CHECKIN_INVALID` `EVENT_NOT_GOING` `VENUE_NOT_FOUND` `POST_NOT_FOUND` `FEED_FORBIDDEN` `MEDIA_NOT_FOUND` `MEDIA_INVALID` `MEDIA_FORBIDDEN` `VERIFICATION_INVALID` `VERIFICATION_NOT_FOUND` `USER_NOT_FOUND` `USER_SELF_ACTION` `ALREADY_BLOCKED` `REPORT_INVALID` `RATE_LIMITED` `INTERNAL`

Clients must switch on `error.code`, not on English `message`.

## Versioning

Breaking change = `/v2`. Additive fields on `/v1` are allowed. Removing or renaming a field is breaking.
