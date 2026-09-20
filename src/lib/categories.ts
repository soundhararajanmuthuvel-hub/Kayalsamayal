/**
 * Dynamic Category Utilities for Kayal Samayal
 *
 * The Google Sheets Products sheet is the single source of truth for categories.
 * These utilities provide slugification, grouping, deduplication, and count calculation
 * without any hardcoded category restrictions.
 */

export interface CategoryCardMeta {
  name: string;
  slug: string;
  tagline: string;
  image: string | null;
  emoji: string;
  count: number;
}

/**
 * Fallback visual metadata (images, taglines, emojis) for established categories.
 * If an admin creates a completely new category in Google Sheets (e.g. "Instant Mixes"),
 * sensible defaults are assigned automatically so the premium layout never breaks.
 */
export const CATEGORY_FALLBACK_META: Record<
  string,
  { tagline: string; image: string; emoji: string }
> = {
  "traditional-masalas": {
    tagline: "Stone-ground everyday and coastal curry blends",
    image: "/assets/fish-curry-masala.jpg",
    emoji: "🌶️",
  },
  "podi-products": {
    tagline: "For idli, dosa and piping hot rice with ghee",
    image: "/assets/andhra-paruppu-sadham-podi.jpg",
    emoji: "🏺",
  },
  "specialty-noodles": {
    tagline: "Millet & moringa noodles for healthy quick meals",
    image: "/assets/moringa-noodles.jpg",
    emoji: "🍜",
  },
  "health-mixes-malts": {
    tagline: "Sathu maavu, ABC malt & herbal nutritional drinks",
    image: "/assets/abc-malt.jpg",
    emoji: "🌾",
  },
  "health-mixes-and-malts": {
    tagline: "Sathu maavu, ABC malt & herbal nutritional drinks",
    image: "/assets/abc-malt.jpg",
    emoji: "🌾",
  },
  "perukalam-legiyam": {
    tagline: "Time-honoured postpartum & digestion remedies",
    image: "/assets/kindiya-kaayam.jpg",
    emoji: "🍯",
  },
};

/**
 * Converts any category string to a clean, URL-safe slug.
 * Example: "Health Mixes & Malts" -> "health-mixes-malts"
 * Example: "Ready To Cook" -> "ready-to-cook"
 */
export function slugifyCategory(category: string): string {
  return String(category || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Normalizes a category string for case-insensitive and whitespace-trimmed matching.
 */
export function normalizeCategory(category: string): string {
  return String(category || "")
    .trim()
    .toLowerCase();
}

/**
 * Dynamically extracts all unique categories from active products.
 * Preserves the original Google Sheets display value deterministically.
 */
export function getUniqueCategories(
  products: Array<{ category?: string; active?: boolean }>
): string[] {
  if (!products || !Array.isArray(products)) return [];

  const seen = new Map<string, string>();

  for (const product of products) {
    // Only include active products (Active === true or not explicitly false)
    if (product && product.active !== false) {
      const rawCat = String(product.category || "").trim();
      if (rawCat) {
        const key = normalizeCategory(rawCat);
        // Keep the first encountered valid Sheet casing
        if (!seen.has(key)) {
          seen.set(key, rawCat);
        }
      }
    }
  }

  return Array.from(seen.values());
}

/**
 * Calculates the number of active products in each category.
 * Returns a record keyed by normalized category name.
 */
export function getCategoryCounts(
  products: Array<{ category?: string; active?: boolean }>
): Record<string, number> {
  const counts: Record<string, number> = {};

  if (!products || !Array.isArray(products)) return counts;

  for (const product of products) {
    if (product && product.active !== false) {
      const rawCat = String(product.category || "").trim();
      if (rawCat) {
        const key = normalizeCategory(rawCat);
        counts[key] = (counts[key] || 0) + 1;
      }
    }
  }

  return counts;
}

/**
 * Matches a URL slug to an existing category display name.
 */
export function findCategoryBySlug(
  categories: string[],
  slug: string
): string | undefined {
  const targetSlug = slugifyCategory(slug);
  return categories.find((c) => slugifyCategory(c) === targetSlug);
}

/**
 * Returns complete category metadata suitable for rendering category cards.
 * Combines dynamic count with curated or auto-assigned image/tagline/emoji.
 */
export function getCategoryCardList(
  products: Array<{ category?: string; active?: boolean; image?: string | null }>
): CategoryCardMeta[] {
  const uniqueCategories = getUniqueCategories(products);
  const counts = getCategoryCounts(products);

  return uniqueCategories.map((name) => {
    const slug = slugifyCategory(name);
    const key = normalizeCategory(name);
    const count = counts[key] || 0;

    // Check for curated fallback meta
    const curated = CATEGORY_FALLBACK_META[slug];

    // If no curated image, find first active product with an image in this category
    let fallbackImage: string | null = null;
    if (!curated?.image) {
      const match = products.find(
        (p) => p.active !== false && normalizeCategory(p.category || "") === key && p.image
      );
      fallbackImage = match?.image || null;
    }

    return {
      name,
      slug,
      tagline: curated?.tagline || `Pure South Indian ${name} prepared without preservatives`,
      image: curated?.image || fallbackImage,
      emoji: curated?.emoji || "🌶️",
      count,
    };
  });
}
