import type { MetadataRoute } from "next";
import { catalogInit } from "../lib/catalog-fetch";
import { resolveApiBase } from "../lib/api-base";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://dorham.app").replace(/\/$/, "");
const API = resolveApiBase();

type Page<T> = { data?: T[] };

async function list<T>(path: string): Promise<T[]> {
  try {
    const res = await fetch(`${API}${path}`, catalogInit());
    if (!res.ok) return [];
    const json = (await res.json()) as Page<T>;
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [events, venues] = await Promise.all([
    list<{ id: string; startsAt: string }>(`/v1/events?city=istanbul&when=upcoming&limit=40`),
    list<{ slug: string }>(`/v1/venues?city=istanbul&limit=80`),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    "",
    "/events",
    "/venues",
    "/feed",
    "/safety",
    "/privacy",
    "/terms",
    "/get-app",
    "/login",
    "/register",
  ].map((path) => ({
    url: `${siteUrl}${path || "/"}`,
    changeFrequency: path === "" || path === "/events" ? "hourly" : "weekly",
    priority: path === "" || path === "/events" ? 1 : 0.6,
  }));

  const eventPages: MetadataRoute.Sitemap = events.map((event) => ({
    url: `${siteUrl}/events/${event.id}`,
    changeFrequency: "hourly",
    priority: 0.9,
  }));

  const venuePages: MetadataRoute.Sitemap = venues.map((venue) => ({
    url: `${siteUrl}/venues/${venue.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticPages, ...eventPages, ...venuePages];
}
