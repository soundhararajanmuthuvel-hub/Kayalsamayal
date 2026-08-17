export type Tier = "regular" | "premium";

export type Category =
  | "Traditional Masalas"
  | "Podi Products"
  | "Specialty Noodles"
  | "Health Mixes & Malts"
  | "PeruKalam Legiyam";

export interface Product {
  id: string;
  name: string;
  category: Category;
  image: string | null; // null = "Photo Coming Soon"
  tier: Tier;
  pairedWith?: string;
  description: string;
  highlights: string[];
  whatsappMessage: string;
}

const BASE_WA = "https://wa.me/919003860616?text=";

function wa(msg: string) {
  return BASE_WA + encodeURIComponent(msg);
}

export const products: Product[] = [
  // ── TRADITIONAL MASALAS ──────────────────────────────────────────────────
  {
    id: "kayal-curry-masala",
    name: "Kayal Curry Masala",
    category: "Traditional Masalas",
    image: "/assets/kayal-curry-masala.jpg",
    tier: "regular",
    description:
      "A bold, aromatic blend of hand-picked coastal spices that transforms every curry into a feast of authentic Kayalpatnam flavour.",
    highlights: ["No artificial colours", "Zero preservatives", "Traditional recipe"],
    whatsappMessage: wa("Hi! I'd like to order Kayal Curry Masala. Please share price & availability."),
  },
  {
    id: "kayal-kalari-masala-regular",
    name: "Kayal Kalari Masala",
    category: "Traditional Masalas",
    image: "/assets/kayal-kalari-masala.jpg",
    tier: "regular",
    pairedWith: "kayal-kalari-masala-premium",
    description:
      "A versatile everyday masala crafted from whole spices, lending a warm, earthy depth to meat and vegetable dishes.",
    highlights: ["Whole spice blend", "No MSG", "Stone-ground"],
    whatsappMessage: wa("Hi! I'd like to order Kayal Kalari Masala (Regular). Please share details."),
  },
  {
    id: "kayal-kalari-masala-premium",
    name: "Kayal Kalari Masala Premium",
    category: "Traditional Masalas",
    image: "/assets/kayal-kalari-masala-premium.jpg",
    tier: "premium",
    pairedWith: "kayal-kalari-masala-regular",
    description:
      "Premium-grade Kalari Masala with richer whole spice proportions and slow-roasted aromatics for connoisseurs.",
    highlights: ["Slow-roasted spices", "Enhanced aroma", "Limited batch"],
    whatsappMessage: wa("Hi! I'd like to order Kayal Kalari Masala (Premium). Please share details."),
  },
  {
    id: "fish-curry-masala-regular",
    name: "Fish Curry Masala",
    category: "Traditional Masalas",
    image: "/assets/fish-curry-masala.jpg",
    tier: "regular",
    pairedWith: "fish-curry-masala-premium",
    description:
      "Specially balanced for coastal fish curries — tangy, spicy, and deeply aromatic with traditional Kayalpatnam know-how.",
    highlights: ["Coastal recipe", "Perfect fish-spice balance", "No artificial flavour"],
    whatsappMessage: wa("Hi! I'd like to order Fish Curry Masala (Regular). Please share details."),
  },
  {
    id: "fish-curry-masala-premium",
    name: "Fish Curry Masala Premium",
    category: "Traditional Masalas",
    image: "/assets/fish-curry-masala-premium.jpg",
    tier: "premium",
    pairedWith: "fish-curry-masala-regular",
    description:
      "Premium Fish Curry Masala using superior whole dried chilies and hand-sorted coastal spices for an elevated catch-of-the-day experience.",
    highlights: ["Superior dried chilies", "Hand-sorted", "Rich coastal depth"],
    whatsappMessage: wa("Hi! I'd like to order Fish Curry Masala (Premium). Please share details."),
  },
  {
    id: "kayal-pepper-masala",
    name: "Kayal Pepper Masala",
    category: "Traditional Masalas",
    image: "/assets/kayal-pepper-masala.jpg",
    tier: "regular",
    description:
      "A fiery pepper-forward masala for bold meat and egg dishes, capturing the heat-loving palate of Kayalpatnam kitchens.",
    highlights: ["High black pepper content", "Zero fillers", "Authentic heat"],
    whatsappMessage: wa("Hi! I'd like to order Kayal Pepper Masala. Please share details."),
  },
  {
    id: "tandoori-kebab-masala",
    name: "Tandoori / Kebab Masala",
    category: "Traditional Masalas",
    image: "/assets/tandoori-kebab-masala.jpg",
    tier: "regular",
    description:
      "Smoky, aromatic tandoori spice blend perfect for grilling, baking, or pan-searing — delivering restaurant-quality results at home.",
    highlights: ["Smoky undertone", "Versatile grilling blend", "No artificial colour"],
    whatsappMessage: wa("Hi! I'd like to order Tandoori/Kebab Masala. Please share details."),
  },
  {
    id: "salna-masala",
    name: "Salna Masala",
    category: "Traditional Masalas",
    image: "/assets/salna-masala.jpg",
    tier: "regular",
    description:
      "The soul of Tamil street food — a rich, layered masala that makes the perfect companion for parottas, chapatis, and biryani.",
    highlights: ["Street food authentic", "Rich layered flavour", "Easy to use"],
    whatsappMessage: wa("Hi! I'd like to order Salna Masala. Please share details."),
  },
  {
    id: "instant-sambar-mix-regular",
    name: "Instant Sambar Mix",
    category: "Traditional Masalas",
    image: "/assets/instant-sambar-mix.jpg",
    tier: "regular",
    pairedWith: "instant-sambar-mix-premium",
    description:
      "Quick-brew sambar powder made from traditional South Indian spices — tangy, hearty, and comforting in minutes.",
    highlights: ["Ready in minutes", "Traditional recipe", "No artificial agents"],
    whatsappMessage: wa("Hi! I'd like to order Instant Sambar Mix (Regular). Please share details."),
  },
  {
    id: "instant-sambar-mix-premium",
    name: "Instant Sambar Mix Premium",
    category: "Traditional Masalas",
    image: "/assets/instant-sambar-mix-premium.jpg",
    tier: "premium",
    pairedWith: "instant-sambar-mix-regular",
    description:
      "Premium Sambar Mix with a richer proportion of sun-dried tomatoes, Byadagi chilli, and aromatic curry leaves for a deeper, more layered bowl.",
    highlights: ["Sun-dried tomatoes", "Byadagi chilli", "Deep aromatic profile"],
    whatsappMessage: wa("Hi! I'd like to order Instant Sambar Mix (Premium). Please share details."),
  },
  {
    id: "biriyani-masala",
    name: "Biriyani Masala",
    category: "Traditional Masalas",
    image: "/assets/biriyani-masala.jpg",
    tier: "regular",
    description:
      "Fragrant whole-spice biriyani blend with kewra-kissed warmth and slow-roasted bay leaf — every grain of rice soaks up the heritage.",
    highlights: ["Whole spice dominant", "Slow roasted", "Aromatic layers"],
    whatsappMessage: wa("Hi! I'd like to order Biriyani Masala. Please share details."),
  },
  {
    id: "instant-rasam-mix",
    name: "Instant Rasam Mix",
    category: "Traditional Masalas",
    image: "/assets/instant-rasam-mix.jpg",
    tier: "regular",
    description:
      "Quick, comforting rasam powder with a tangy tamarind-pepper base and warming black pepper — ready in under 5 minutes.",
    highlights: ["5-minute preparation", "Traditional tang", "Digestive spices"],
    whatsappMessage: wa("Hi! I'd like to order Instant Rasam Mix. Please share details."),
  },

  // ── PODI PRODUCTS ─────────────────────────────────────────────────────────
  {
    id: "kayal-rasam-podi",
    name: "Kayal Rasam Podi",
    category: "Podi Products",
    image: "/assets/kayal-rasam-podi.jpg",
    tier: "regular",
    description:
      "Aromatic rasam podi stone-ground from whole black pepper, cumin, and coriander — the heartbeat of a South Indian kitchen.",
    highlights: ["Stone-ground", "No additives", "Whole pepper & cumin"],
    whatsappMessage: wa("Hi! I'd like to order Kayal Rasam Podi. Please share details."),
  },
  {
    id: "kayal-keerai-podi-regular",
    name: "Kayal Keerai Podi",
    category: "Podi Products",
    image: "/assets/kayal-keerai-podi.jpg",
    tier: "regular",
    pairedWith: "kayal-keerai-podi-premium",
    description:
      "A nutritious greens podi crafted from dried spinach, lentils, and mild spices — healthy, quick, and deeply satisfying.",
    highlights: ["Greens-rich", "Iron-boosting", "Balanced mild spice"],
    whatsappMessage: wa("Hi! I'd like to order Kayal Keerai Podi (Regular). Please share details."),
  },
  {
    id: "kayal-keerai-podi-premium",
    name: "Kayal Keerai Podi Premium",
    category: "Podi Products",
    image: "/assets/kayal-keerai-podi-premium.jpg",
    tier: "premium",
    pairedWith: "kayal-keerai-podi-regular",
    description:
      "Premium Keerai Podi with a higher proportion of dried drumstick leaves and moringa powder for enhanced nutrition.",
    highlights: ["Moringa-enriched", "High nutrition", "Premium greens blend"],
    whatsappMessage: wa("Hi! I'd like to order Kayal Keerai Podi (Premium). Please share details."),
  },
  {
    id: "beachside-secret-fish-podi-regular",
    name: "Beachside Secret Fish Podi",
    category: "Podi Products",
    image: "/assets/beachside-secret-fish-podi.jpg",
    tier: "regular",
    pairedWith: "beachside-secret-fish-podi-premium",
    description:
      "An age-old coastal fish podi with secret Kayalpatnam spice proportions — the perfect companion for fried fish and rice.",
    highlights: ["Secret coastal blend", "Perfect with fried fish", "Traditional recipe"],
    whatsappMessage: wa("Hi! I'd like to order Beachside Secret Fish Podi (Regular). Please share details."),
  },
  {
    id: "beachside-secret-fish-podi-premium",
    name: "Beachside Secret Fish Podi Premium",
    category: "Podi Products",
    image: "/assets/beachside-secret-fish-podi-premium.jpg",
    tier: "premium",
    pairedWith: "beachside-secret-fish-podi-regular",
    description:
      "Premium Beachside Fish Podi with hand-selected dried chilies and extra virgin sesame notes for an elevated coastal dining experience.",
    highlights: ["Hand-selected chilies", "Sesame notes", "Premium coastal blend"],
    whatsappMessage: wa("Hi! I'd like to order Beachside Secret Fish Podi (Premium). Please share details."),
  },
  {
    id: "kayal-marunthu-satha-podi",
    name: "Kayal Marunthu Satha Podi",
    category: "Podi Products",
    image: "/assets/kayal-marunthu-satha-podi.jpg",
    tier: "regular",
    description:
      "A traditional healing rice podi made from medicinal herbs and warming spices — both nourishing and flavourful.",
    highlights: ["Medicinal herbs", "Healing properties", "Traditional recipe"],
    whatsappMessage: wa("Hi! I'd like to order Kayal Marunthu Satha Podi. Please share details."),
  },
  {
    id: "andhra-paruppu-sadham-podi-regular",
    name: "Andhra Paruppu Sadham Podi",
    category: "Podi Products",
    image: "/assets/andhra-paruppu-sadham-podi.jpg",
    tier: "regular",
    pairedWith: "andhra-paruppu-sadham-podi-premium",
    description:
      "A fiery Andhra-style dal rice podi with roasted lentils and bold spice — a quick and satisfying meal companion.",
    highlights: ["Andhra bold spice", "Roasted lentils", "Hearty & satisfying"],
    whatsappMessage: wa("Hi! I'd like to order Andhra Paruppu Sadham Podi (Regular). Please share details."),
  },
  {
    id: "andhra-paruppu-sadham-podi-premium",
    name: "Andhra Paruppu Sadham Podi Premium",
    category: "Podi Products",
    image: "/assets/andhra-paruppu-sadham-podi-premium.jpg",
    tier: "premium",
    pairedWith: "andhra-paruppu-sadham-podi-regular",
    description:
      "Premium Andhra Podi with a higher lentil-to-spice ratio and slow-roasted garlic for a richer, bolder flavour profile.",
    highlights: ["Slow-roasted garlic", "Higher lentil ratio", "Bold premium profile"],
    whatsappMessage: wa("Hi! I'd like to order Andhra Paruppu Sadham Podi (Premium). Please share details."),
  },

  // ── SPECIALTY NOODLES ─────────────────────────────────────────────────────
  {
    id: "red-rice-noodles",
    name: "Red Rice Noodles",
    category: "Specialty Noodles",
    image: "/assets/red-rice-noodles.jpg",
    tier: "regular",
    description:
      "Wholesome noodles crafted from traditional red rice — high in fibre, rich in antioxidants, and deliciously chewy.",
    highlights: ["Whole grain red rice", "High fibre", "Antioxidant-rich"],
    whatsappMessage: wa("Hi! I'd like to order Red Rice Noodles. Please share details."),
  },
  {
    id: "moringa-noodles",
    name: "Moringa Noodles",
    category: "Specialty Noodles",
    image: "/assets/moringa-noodles.jpg",
    tier: "regular",
    description:
      "Nutrient-dense noodles enriched with moringa leaf powder — a powerhouse of vitamins and minerals in every bite.",
    highlights: ["Moringa-enriched", "Vitamin-dense", "Clean ingredients"],
    whatsappMessage: wa("Hi! I'd like to order Moringa Noodles. Please share details."),
  },

  // ── HEALTH MIXES & MALTS ─────────────────────────────────────────────────
  {
    id: "golden-milk-magic-regular",
    name: "Golden Milk Magic",
    category: "Health Mixes & Malts",
    image: "/assets/golden-milk-magic.jpg",
    tier: "regular",
    pairedWith: "golden-milk-magic-premium",
    description:
      "A warming turmeric-milk blend with black pepper, ginger, and cardamom — the South Indian golden latte experience.",
    highlights: ["Turmeric-forward", "Ginger & cardamom", "Warming & soothing"],
    whatsappMessage: wa("Hi! I'd like to order Golden Milk Magic (Regular). Please share details."),
  },
  {
    id: "golden-milk-magic-premium",
    name: "Golden Milk Magic Premium",
    category: "Health Mixes & Malts",
    image: "/assets/golden-milk-magic-premium.jpg",
    tier: "premium",
    pairedWith: "golden-milk-magic-regular",
    description:
      "Premium Golden Milk with organic turmeric, long pepper, and ashwagandha for enhanced anti-inflammatory and adaptogenic benefits.",
    highlights: ["Organic turmeric", "Ashwagandha", "Adaptogenic blend"],
    whatsappMessage: wa("Hi! I'd like to order Golden Milk Magic (Premium). Please share details."),
  },
  {
    id: "sukku-malli-herbal-kaafi",
    name: "Sukku Malli Herbal Kaafi",
    category: "Health Mixes & Malts",
    image: "/assets/sukku-malli-herbal-kaafi.jpg",
    tier: "regular",
    description:
      "A traditional South Indian herbal coffee with dried ginger (sukku) and coriander seeds — warming, digestive, and caffeine-free.",
    highlights: ["Caffeine-free", "Dried ginger blend", "Digestive herbal infusion"],
    whatsappMessage: wa("Hi! I'd like to order Sukku Malli Herbal Kaafi. Please share details."),
  },
  {
    id: "multi-millet-pongal-mix",
    name: "Multi Millet Pongal Mix",
    category: "Health Mixes & Malts",
    image: "/assets/multi-millet-pongal-mix.jpg",
    tier: "regular",
    description:
      "A wholesome blend of multi-millets for the classic South Indian pongal — nutritious, gluten-friendly, and quick to prepare.",
    highlights: ["Multi-millet blend", "Gluten-friendly", "Wholesome & nutritious"],
    whatsappMessage: wa("Hi! I'd like to order Multi Millet Pongal Mix. Please share details."),
  },
  {
    id: "root-power-regular",
    name: "Root Power",
    category: "Health Mixes & Malts",
    image: "/assets/root-power.jpg",
    tier: "regular",
    pairedWith: "root-power-premium",
    description:
      "A potent blend of traditional root herbs — turmeric, ginger, galangal, and more — to support immunity and vitality.",
    highlights: ["Root herb blend", "Immunity support", "Traditional wisdom"],
    whatsappMessage: wa("Hi! I'd like to order Root Power (Regular). Please share details."),
  },
  {
    id: "root-power-premium",
    name: "Root Power Premium",
    category: "Health Mixes & Malts",
    image: "/assets/root-power-premium.jpg",
    tier: "premium",
    pairedWith: "root-power-regular",
    description:
      "Premium Root Power with a richer concentration of rare roots and certified organic herbs for maximum therapeutic benefit.",
    highlights: ["Rare roots", "Certified organic", "Maximum potency"],
    whatsappMessage: wa("Hi! I'd like to order Root Power (Premium). Please share details."),
  },
  {
    id: "abc-malt-regular",
    name: "A.B.C. Malt",
    category: "Health Mixes & Malts",
    image: "/assets/abc-malt.jpg",
    tier: "regular",
    pairedWith: "abc-malt-premium",
    description:
      "Apple, Beetroot & Carrot malt — a natural energy booster packed with plant-based nutrients for daily wellness.",
    highlights: ["Apple · Beetroot · Carrot", "Natural energy", "Plant nutrients"],
    whatsappMessage: wa("Hi! I'd like to order A.B.C. Malt (Regular). Please share details."),
  },
  {
    id: "abc-malt-premium",
    name: "A.B.C. Malt Premium",
    category: "Health Mixes & Malts",
    image: "/assets/abc-malt-premium.jpg",
    tier: "premium",
    pairedWith: "abc-malt-regular",
    description:
      "Premium A.B.C. Malt with cold-pressed fruit extracts and added amla for a deeper nutritional profile and better bioavailability.",
    highlights: ["Cold-pressed extracts", "Amla-enriched", "Superior bioavailability"],
    whatsappMessage: wa("Hi! I'd like to order A.B.C. Malt (Premium). Please share details."),
  },
  {
    id: "slim-sakthi",
    name: "Slim Sakthi",
    category: "Health Mixes & Malts",
    image: "/assets/slim-sakthi.jpg",
    tier: "regular",
    description:
      "A traditional herbal slimming blend curated from metabolism-supporting herbs and seeds — supporting a healthy lifestyle naturally.",
    highlights: ["Herbal slimming blend", "Metabolism support", "No stimulants"],
    whatsappMessage: wa("Hi! I'd like to order Slim Sakthi. Please share details."),
  },
  {
    id: "kavunirich",
    name: "Kavunirich",
    category: "Health Mixes & Malts",
    image: "/assets/kavunirich.jpg",
    tier: "regular",
    description:
      "A rich kavuni (black sticky rice) malt blend — deeply nutritious, antioxidant-laden, and traditionally prized in coastal Tamil Nadu.",
    highlights: ["Black sticky rice", "Antioxidant-rich", "Coastal tradition"],
    whatsappMessage: wa("Hi! I'd like to order Kavunirich. Please share details."),
  },
  {
    id: "health-mix-multigrains",
    name: "Health Mix Multigrains",
    category: "Health Mixes & Malts",
    image: "/assets/health-mix-multigrains.jpg",
    tier: "regular",
    description:
      "A wholesome multigrain health mix with roasted cereals, millets, and legumes — a complete nutritional meal for all ages.",
    highlights: ["Multi-cereal blend", "Suitable for all ages", "Complete nutrition"],
    whatsappMessage: wa("Hi! I'd like to order Health Mix Multigrains. Please share details."),
  },
  {
    id: "nannari-sukku-powder",
    name: "Nannari Sukku Powder",
    category: "Health Mixes & Malts",
    image: "/assets/nannari-sukku-powder.jpg",
    tier: "regular",
    description:
      "A cooling and digestive herbal powder combining nannari (sarsaparilla) and dried ginger — a traditional South Indian remedy for summer wellness.",
    highlights: ["Cooling properties", "Digestive aid", "Sarsaparilla & ginger"],
    whatsappMessage: wa("Hi! I'd like to order Nannari Sukku Powder. Please share details."),
  },

  // ── PERUKALAM LEGIYAM ─────────────────────────────────────────────────────
  {
    id: "kindiya-kaayam",
    name: "Kindiya Kaayam",
    category: "PeruKalam Legiyam",
    image: "/assets/kindiya-kaayam.jpg",
    tier: "regular",
    description:
      "A traditional PeruKalam legiyam (herbal paste) crafted from time-tested Siddha herbs for digestive strength and holistic wellness.",
    highlights: ["Siddha herb recipe", "Digestive strength", "Holistic wellness"],
    whatsappMessage: wa("Hi! I'd like to order Kindiya Kaayam (PeruKalam Legiyam). Please share details."),
  },
];

export const categories: Category[] = [
  "Traditional Masalas",
  "Podi Products",
  "Specialty Noodles",
  "Health Mixes & Malts",
  "PeruKalam Legiyam",
];
