import type { MetadataRoute } from "next";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://dorham.app").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/account", "/admin", "/admin/", "/events/new", "/venues/new"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
