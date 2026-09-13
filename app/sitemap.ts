import type { MetadataRoute } from "next";
import { SITE_URL, PUBLISHED_AT } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const published = new Date(PUBLISHED_AT);
  return [
    {
      url: SITE_URL,
      lastModified: published,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/payment`,
      lastModified: published,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/faq`,
      lastModified: published,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/learn`,
      lastModified: published,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/learn/what-is-a-disposable-browser`,
      lastModified: published,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/learn/tor-browser-and-onion-sites`,
      lastModified: published,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/learn/pay-online-privately`,
      lastModified: published,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/buy-vouchers`,
      lastModified: published,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/balance`,
      lastModified: published,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/survey`,
      lastModified: published,
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];
}