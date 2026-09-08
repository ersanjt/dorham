# 05 — Security

Dating-adjacent + location + diaspora photos is a high-risk dataset. Treat every row as something that could harm a person in Iran or their family.

## Must

- Argon2id for passwords
- Refresh tokens hashed at rest; rotate; revoke on logout / password change
- Lock account after repeated failed logins
- Rate-limit `/v1/auth/*` harder than the rest
- Helmet, CORS allowlist, hide `X-Powered-By`
- Request IDs on every response
- Signed, short-lived media URLs — never public `/uploads/user-123.jpg`
- Verification photos are admin-only, not CDN-public
- Other users never see email, phone, exact GPS, or device IDs
- Store city, not raw coordinates, until a feature needs a map
- Audit admin and verify decisions
- Parameterized queries only (Prisma)
- Secrets in env, never in git

## Must not

- Log bodies of auth or profile patches
- Use JWT as the only session record (we keep `Session` rows)
- Trust client-sent `role` or `userId`
- Enable OpenAPI in production without auth
- Email users their password
- Build scrapable “nearby grid” with meter-level distance

## Legal / ops

- Age 18+
- KVKK / GDPR-minded privacy policy before public launch
- Delete account = real delete or scheduled hard-delete, not a hidden flag forever
- EU region for primary DB when we leave localhost

## Incident

1. Rotate JWT secrets and revoke all sessions
2. Invalidate storage keys
3. Write the incident in `docs/` only after users are protected
