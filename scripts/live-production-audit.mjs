#!/usr/bin/env node
/**
 * Live Production Website Audit for https://www.kayalsamayal.in
 */

const BASE_URL = "https://www.kayalsamayal.in";

const PRODUCT_SLUGS = [
  "kayal-curry-masala",
  "kayal-kalari-masala-regular",
  "kayal-kalari-masala-premium",
  "fish-curry-masala-regular",
  "fish-curry-masala-premium",
  "kayal-pepper-masala",
  "tandoori-kebab-masala",
  "salna-masala",
  "instant-sambar-mix-regular",
  "instant-sambar-mix-premium",
  "biriyani-masala",
  "instant-rasam-mix",
  "kayal-rasam-podi",
  "kayal-keerai-podi-regular",
  "kayal-keerai-podi-premium",
  "beachside-secret-fish-podi-regular",
  "beachside-secret-fish-podi-premium",
  "kayal-marunthu-satha-podi",
  "andhra-paruppu-sadham-podi-regular",
  "andhra-paruppu-sadham-podi-premium",
  "red-rice-noodles",
  "moringa-noodles",
  "golden-milk-magic-regular",
  "golden-milk-magic-premium",
  "sukku-malli-herbal-kaafi",
  "multi-millet-pongal-mix",
  "root-power-regular",
  "root-power-premium",
  "abc-malt-regular",
  "abc-malt-premium",
  "slim-sakthi",
  "kavunirich",
  "health-mix-multigrains",
  "nannari-sukku-powder",
  "kindiya-kaayam",
];

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

async function runLiveAudit() {
  console.log("==================================================");
  console.log(`Starting Live Production Audit on ${BASE_URL}`);
  console.log("==================================================\n");

  // 1. Audit robots.txt
  console.log("--- 1. Checking robots.txt ---");
  try {
    const robotsRes = await fetchWithTimeout(`${BASE_URL}/robots.txt`);
    const robotsTxt = await robotsRes.text();
    console.log(`robots.txt Status: HTTP ${robotsRes.status}`);
    console.log(`Contains sitemap: ${robotsTxt.includes("sitemap.xml") ? "YES" : "NO"}`);
    console.log(`Disallowed /checkout: ${robotsTxt.includes("/checkout") ? "YES" : "NO"}`);
    console.log(`Blocked /products: ${robotsTxt.includes("disallow: /products") ? "YES (ERROR)" : "NO (OK)"}`);
  } catch (e) {
    console.error("Error fetching robots.txt:", e.message);
  }

  // 2. Audit sitemap.xml
  console.log("\n--- 2. Checking sitemap.xml ---");
  let sitemapProductCount = 0;
  try {
    const sitemapRes = await fetchWithTimeout(`${BASE_URL}/sitemap.xml`);
    const sitemapXml = await sitemapRes.text();
    console.log(`sitemap.xml Status: HTTP ${sitemapRes.status}`);
    
    PRODUCT_SLUGS.forEach((slug) => {
      const pUrl = `${BASE_URL}/products/${slug}`;
      if (sitemapXml.includes(pUrl)) {
        sitemapProductCount++;
      } else {
        console.warn(`[SITEMAP MISSING] ${pUrl}`);
      }
    });
    console.log(`Sitemap Products Present: ${sitemapProductCount} / ${PRODUCT_SLUGS.length}`);
  } catch (e) {
    console.error("Error fetching sitemap.xml:", e.message);
  }

  // 3. Audit every product URL
  console.log("\n--- 3. Auditing All 35 Product URLs Live ---");
  const results = [];

  for (let i = 0; i < PRODUCT_SLUGS.length; i++) {
    const slug = PRODUCT_SLUGS[i];
    const targetUrl = `${BASE_URL}/products/${slug}`;
    const itemResult = {
      index: i + 1,
      slug,
      url: targetUrl,
      httpStatus: 0,
      canonicalOk: false,
      canonicalUrl: "",
      titleOk: false,
      title: "",
      descriptionOk: false,
      description: "",
      h1Ok: false,
      h1: "",
      productSchemaOk: false,
      breadcrumbSchemaOk: false,
      imageOk: false,
      imageUrl: "",
      error: null,
    };

    try {
      const res = await fetchWithTimeout(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        },
      });
      itemResult.httpStatus = res.status;

      if (res.ok) {
        const html = await res.text();

        // Check Canonical
        const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) ||
                               html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
        if (canonicalMatch) {
          itemResult.canonicalUrl = canonicalMatch[1];
          itemResult.canonicalOk = (canonicalMatch[1] === targetUrl);
        }

        // Check Title
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) {
          itemResult.title = titleMatch[1].trim();
          itemResult.titleOk = itemResult.title.length > 5;
        }

        // Check Meta Description
        const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
                          html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
        if (descMatch) {
          itemResult.description = descMatch[1].trim();
          itemResult.descriptionOk = itemResult.description.length > 10;
        }

        // Check H1
        const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        if (h1Match) {
          itemResult.h1 = h1Match[1].trim();
          itemResult.h1Ok = itemResult.h1.length > 0;
        }

        // Check JSON-LD Product & BreadcrumbList
        const jsonLdMatches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
        for (const match of jsonLdMatches) {
          try {
            const parsed = JSON.parse(match[1]);
            const checkSchemaObj = (obj) => {
              if (!obj) return;
              if (obj["@type"] === "Product") itemResult.productSchemaOk = true;
              if (obj["@type"] === "BreadcrumbList") itemResult.breadcrumbSchemaOk = true;
              if (Array.isArray(obj["@graph"])) {
                obj["@graph"].forEach(checkSchemaObj);
              }
            };
            checkSchemaObj(parsed);
          } catch (jsonErr) {
            // ignore parse error if other script
          }
        }

        // Check Image HTTP Status
        const imgMatch = html.match(/<img[^>]+src=["'](\/assets\/[^"']+)["']/i) ||
                         html.match(/<img[^>]+src=["'](https?:\/\/[^"']+\/assets\/[^"']+)["']/i);
        if (imgMatch) {
          const rawImg = imgMatch[1];
          const imgUrl = rawImg.startsWith("http") ? rawImg : `${BASE_URL}${rawImg}`;
          itemResult.imageUrl = imgUrl;
          try {
            const imgRes = await fetchWithTimeout(imgUrl, { method: "HEAD" });
            itemResult.imageOk = imgRes.ok;
          } catch {
            itemResult.imageOk = false;
          }
        } else {
          // fallback check default image
          const fallbackImg = `${BASE_URL}/assets/${slug}.jpg`;
          const imgRes = await fetchWithTimeout(fallbackImg, { method: "HEAD" }).catch(() => null);
          if (imgRes && imgRes.ok) {
            itemResult.imageUrl = fallbackImg;
            itemResult.imageOk = true;
          }
        }
      }
    } catch (err) {
      itemResult.error = err.message;
    }

    results.push(itemResult);
    console.log(`[${itemResult.index}/35] ${slug} -> HTTP ${itemResult.httpStatus} | Canonical: ${itemResult.canonicalOk ? "OK" : "FAIL"} | Title: ${itemResult.titleOk ? "OK" : "FAIL"} | H1: ${itemResult.h1Ok ? "OK" : "FAIL"} | Schema: ${itemResult.productSchemaOk ? "OK" : "FAIL"} | Img: ${itemResult.imageOk ? "OK" : "FAIL"}`);
  }

  // Summary counts
  const count200 = results.filter((r) => r.httpStatus === 200).length;
  const countCanonical = results.filter((r) => r.canonicalOk).length;
  const countTitle = results.filter((r) => r.titleOk).length;
  const countDesc = results.filter((r) => r.descriptionOk).length;
  const countH1 = results.filter((r) => r.h1Ok).length;
  const countProductSchema = results.filter((r) => r.productSchemaOk).length;
  const countBreadcrumbSchema = results.filter((r) => r.breadcrumbSchemaOk).length;
  const countImage = results.filter((r) => r.imageOk).length;

  console.log("\n==================================================");
  console.log("FINAL LIVE AUDIT TOTALS:");
  console.log(`HTTP 200:           ${count200} / 35`);
  console.log(`Canonical Match:    ${countCanonical} / 35`);
  console.log(`Title Present:      ${countTitle} / 35`);
  console.log(`Meta Description:   ${countDesc} / 35`);
  console.log(`H1 Present:         ${countH1} / 35`);
  console.log(`Product Schema:     ${countProductSchema} / 35`);
  console.log(`Breadcrumb Schema:  ${countBreadcrumbSchema} / 35`);
  console.log(`Images Loading:     ${countImage} / 35`);
  console.log("==================================================");

  // Write detailed results to JSON for table rendering
  fs.writeFileSync("scripts/live-audit-results.json", JSON.stringify(results, null, 2));
}

import fs from "fs";
runLiveAudit().catch(console.error);
