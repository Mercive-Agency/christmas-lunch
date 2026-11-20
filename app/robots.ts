import type { MetadataRoute } from "next";

/** Asks every search engine to stay away. Every page also sends a noindex header (next.config.ts). */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
