"use client";

import { useState } from "react";
import { CheckCircle2, Sparkles, MessageCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { whatsappLink } from "@/lib/brand";

interface HealthProduct {
  id: string;
  name: string;
  emoji: string;
  benefits: string[];
  ingredients: string[];
  usage: string;
  waMsg: string;
}

const healthProducts: HealthProduct[] = [
  {
    id: "abc-malt",
    name: "A.B.C. Malt (Apple, Beetroot, Carrot)",
    emoji: "🍎",
    benefits: [
      "Rich in natural antioxidants and Vitamin C",
      "Purifies blood and enhances natural skin glow",
      "Boosts daily stamina and physical energy naturally",
      "Helps maintain optimal healthy hemoglobin levels",
    ],
    ingredients: ["Fresh Apple Extract", "Beetroot Extract", "Carrot Extract", "Premium Almonds", "Cashews", "Cardamom", "Natural Country Jaggery Sugar"],
    usage: "Add 1-2 tablespoons of ABC Malt to a cup of warm milk or water. Stir well. No need to boil. Drink warm.",
    waMsg: "Hi Kayal Samayal! I'd like to order ABC Malt.",
  },
  {
    id: "golden-milk",
    name: "Golden Milk Magic (Immunity Turmeric Mix)",
    emoji: "🥛",
    benefits: [
      "Promotes strong immunity and natural infection resistance",
      "Soothes sore throats, colds, and respiratory blockages",
      "Improves restful sleep cycles and calm digestion",
      "Curcumin-rich whole coastal turmeric with black pepper",
    ],
    ingredients: ["Curcumin Turmeric", "Black Pepper", "Dry Ginger (Sukku)", "Cardamom", "Ayurvedic Herbs"],
    usage: "Mix 1/2 teaspoon into hot milk. Simmer for 1-2 minutes. Sweeten with country sugar or honey. Drink warm before sleep.",
    waMsg: "Hi Kayal Samayal! I'd like to order Golden Milk Magic.",
  },
  {
    id: "kavunirich",
    name: "Kavunirich (Black Rice Heritage Mix)",
    emoji: "🌾",
    benefits: [
      "Rich in anthocyanin antioxidants",
      "High dietary fiber content aids gut health",
      "Regulates blood pressure and metabolic rate",
      "Ancient Tamil supergrain for longevity",
    ],
    ingredients: ["Traditional Kavuni Rice", "Mappillai Samba Rice", "Whole Grains", "Cardamom"],
    usage: "Add 2 tablespoons to water or buttermilk. Cook on low flame for 5 minutes stirring continuously. Enjoy as warm porridge.",
    waMsg: "Hi Kayal Samayal! I'd like to order Kavunirich.",
  },
  {
    id: "sukku-coffee",
    name: "Sukku Malli Herbal Kaafi",
    emoji: "☕",
    benefits: [
      "Provides relief from seasonal chills, headaches, and cough",
      "Aids post-meal digestion and neutralizes acidity",
      "100% caffeine-free natural body energizer",
      "Traditional home remedy for all ages",
    ],
    ingredients: ["Dry Ginger (Sukku)", "Coriander Seeds (Malli)", "Black Pepper", "Cardamom", "Natural Herbs"],
    usage: "Boil 1 teaspoon with a cup of water and palm jaggery for 3 minutes. Strain and sip hot.",
    waMsg: "Hi Kayal Samayal! I'd like to order Sukku Malli Kaafi.",
  },
  {
    id: "slim-sakthi",
    name: "Slim Sakthi (Metabolic Wellness Mix)",
    emoji: "🥗",
    benefits: [
      "Enhances natural metabolism and digestion",
      "Curbs unhealthy sugar cravings naturally",
      "High fiber and roasted millet protein",
      "Low glycemic index keeps you energetic",
    ],
    ingredients: ["Roasted Millets", "Horsegram", "Flax Seeds", "Fenugreek", "Digestive Spices"],
    usage: "Mix 2 spoons in warm water or thin buttermilk. Drink twice daily before main meals.",
    waMsg: "Hi Kayal Samayal! I'd like to order Slim Sakthi.",
  },
];

export default function HealthMixesInteractive() {
  const [activeTab, setActiveTab] = useState<string>("abc-malt");

  const current = healthProducts.find((p) => p.id === activeTab) || healthProducts[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* Left Column: Product Selection Tabs */}
      <div className="lg:col-span-4 rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-[var(--shadow-card)] space-y-2">
        <h3 className="font-display font-bold text-sm tracking-wider uppercase text-primary px-3 py-2 border-b border-border">
          Traditional Nutrition Menu
        </h3>
        {healthProducts.map((p) => {
          const isActive = p.id === activeTab;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setActiveTab(p.id)}
              className={`w-full text-left p-3.5 rounded-2xl transition-all flex items-center justify-between cursor-pointer ${
                isActive
                  ? "bg-primary text-primary-foreground font-bold shadow-sm"
                  : "hover:bg-accent text-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{p.emoji}</span>
                <span className="text-xs sm:text-sm font-semibold">{p.name}</span>
              </div>
              <ArrowRight className={`h-4 w-4 shrink-0 ${isActive ? "text-gold" : "text-muted-foreground opacity-50"}`} />
            </button>
          );
        })}
      </div>

      {/* Right Column: Detailed Benefits & Usage Panel */}
      <div className="lg:col-span-8 rounded-3xl border border-border/80 bg-card p-6 sm:p-10 shadow-[var(--shadow-card)] space-y-6 animate-in fade-in">
        
        {/* Product Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="text-4xl p-2 rounded-2xl bg-surface border border-border/60">{current.emoji}</span>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                100% Traditional Recipe
              </span>
              <h2 className="font-display font-bold text-xl sm:text-2xl text-primary">
                {current.name}
              </h2>
            </div>
          </div>

          <a
            href={whatsappLink(current.waMsg)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="whatsapp" size="sm" className="gap-1.5 font-bold shadow-xs">
              <MessageCircle className="h-4 w-4" />
              <span>Order on WhatsApp</span>
            </Button>
          </a>
        </div>

        {/* Benefits Grid */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
            Key Health Benefits
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {current.benefits.map((b, idx) => (
              <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-surface border border-border/60 text-xs sm:text-sm text-foreground">
                <CheckCircle2 className="h-4 w-4 text-leaf shrink-0 mt-0.5" />
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ingredients */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
            Clean Whole Ingredients
          </h3>
          <div className="flex flex-wrap gap-2">
            {current.ingredients.map((ing, idx) => (
              <span
                key={idx}
                className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-primary border border-border/60"
              >
                {ing}
              </span>
            ))}
          </div>
        </div>

        {/* How to Prepare / Usage */}
        <div className="rounded-2xl bg-surface border border-border/70 p-4 sm:p-5 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>How to Prepare & Consume</span>
          </h3>
          <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-medium">
            {current.usage}
          </p>
        </div>

      </div>

    </div>
  );
}
