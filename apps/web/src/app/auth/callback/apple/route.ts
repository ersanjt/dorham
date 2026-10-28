import { NextRequest, NextResponse } from "next/server";
import { applePersonName } from "../../../../lib/apple-name";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const url = new URL("/auth/callback", request.nextUrl.origin);
  const code = form.get("code");
  const state = form.get("state");
  const error = form.get("error");
  if (typeof code === "string") url.searchParams.set("code", code);
  if (typeof state === "string") url.searchParams.set("state", state);
  if (typeof error === "string") url.searchParams.set("error", error);
  url.searchParams.set("via", "apple");
  const name = applePersonName(form.get("user"));
  if (name) url.searchParams.set("name", name);
  const response = NextResponse.redirect(url, 303);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
