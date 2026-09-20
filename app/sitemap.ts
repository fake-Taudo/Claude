import type { MetadataRoute } from "next";
import { site } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: site.brand.url, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${site.brand.url}/impressum`, lastModified: now, priority: 0.2 },
    { url: `${site.brand.url}/datenschutz`, lastModified: now, priority: 0.2 },
  ];
}
