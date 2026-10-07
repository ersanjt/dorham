/** Public catalog may be up to a minute stale. RSVP and guest lists stay `no-store`. */
export const CATALOG_REVALIDATE = 60;

export function catalogInit(): RequestInit {
  return { next: { revalidate: CATALOG_REVALIDATE } } as RequestInit;
}
