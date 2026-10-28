import { NextRequest, NextResponse } from "next/server";
import { applePersonName } from "../../../../lib/apple-name";

export const dynamic = "force-dynamic";

function bounce(params: URLSearchParams) {
  const target = new URL("dorham://auth/callback");
  for (const key of ["code", "state", "error", "name"]) {
    const value = params.get(key);
    if (value) target.searchParams.set(key, value);
  }
  const href = target.toString();
  const html = `<!doctype html><meta charset="utf-8"><title>Dorham</title><p>در حال بازگشت به اپ…</p><script>location.replace(${JSON.stringify(href)})</script>`;
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}

export function GET(request: NextRequest) {
  return bounce(request.nextUrl.searchParams);
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const params = new URLSearchParams();
  for (const key of ["code", "state", "error"]) {
    const value = form.get(key);
    if (typeof value === "string") params.set(key, value);
  }
  const name = applePersonName(form.get("user"));
  if (name) params.set("name", name);
  return bounce(params);
}
