import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ListEventsQuery } from "@dorham/shared";
import { eventListWhere } from "./list-where";

const now = new Date("2026-10-13T00:00:00.000Z");

function query(partial: Partial<ListEventsQuery>): ListEventsQuery {
  return {
    city: "istanbul",
    when: "upcoming",
    limit: 20,
    ...partial,
  };
}

describe("eventListWhere", () => {
  it("keeps upcoming lists to published future events", () => {
    const where = eventListWhere(query({ when: "upcoming", kind: "COMMUNITY" }), now);
    assert.equal(where.status, "PUBLISHED");
    assert.deepEqual(where.startsAt, { gte: now });
    assert.equal(where.kind, "COMMUNITY");
    assert.equal(where.AND, undefined);
  });

  it("hides empty past community nights from the public archive", () => {
    const where = eventListWhere(query({ when: "past", kind: "COMMUNITY" }), now);
    assert.deepEqual(where.AND, [
      { OR: [{ status: "ENDED" }, { status: "PUBLISHED", startsAt: { lt: now } }] },
      { OR: [{ kind: "CITY_SHOW" }, { rsvps: { some: { status: "GOING" } } }] },
    ]);
  });

  it("keeps the archive filter when a stranger passes hostId", () => {
    const where = eventListWhere(query({ when: "past", hostId: "host_12345678" }), now);
    assert.equal(where.hostId, "host_12345678");
    assert.deepEqual(where.AND, [
      { OR: [{ status: "ENDED" }, { status: "PUBLISHED", startsAt: { lt: now } }] },
      { OR: [{ kind: "CITY_SHOW" }, { rsvps: { some: { status: "GOING" } } }] },
    ]);
  });

  it("lets a host see their own empty past nights", () => {
    const where = eventListWhere(query({ when: "past", hostId: "host_12345678" }), now, {
      id: "host_12345678",
      role: "HOST",
    });
    assert.equal(where.hostId, "host_12345678");
    assert.deepEqual(where.AND, [
      { OR: [{ status: "ENDED" }, { status: "PUBLISHED", startsAt: { lt: now } }] },
    ]);
  });

  it("lets staff see a host's empty past nights", () => {
    const where = eventListWhere(query({ when: "past", hostId: "host_12345678" }), now, {
      id: "mod_123456789",
      role: "MODERATOR",
    });
    assert.deepEqual(where.AND, [
      { OR: [{ status: "ENDED" }, { status: "PUBLISHED", startsAt: { lt: now } }] },
    ]);
  });
});
