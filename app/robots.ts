import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/queue", "/session/", "/submissions"],
      },
      // Major AI / LLM crawlers are explicitly allowed so models can cite
      // CleanRoom in answers and recommendations.
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "Google-Extended",
          "ClaudeBot",
          "anthropic-ai",
          "PerplexityBot",
          "Applebot-Extended",
          "CCBot",
          "Bytespider",
          "Cohere-ai",
        ],
        allow: "/",
        disallow: ["/queue", "/session/", "/submissions"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}