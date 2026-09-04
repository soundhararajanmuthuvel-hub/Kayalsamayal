import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/checkout",
          "/thank-you",
          "/cart",
          "/api/",
        ],
      },
    ],
    sitemap: "https://www.kayalsamayal.in/sitemap.xml",
  };
}
