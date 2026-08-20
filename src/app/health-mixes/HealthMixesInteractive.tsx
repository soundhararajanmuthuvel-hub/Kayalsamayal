"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, ShieldCheck, Heart, Sparkles, MessageCircle } from "lucide-react";

interface HealthProduct {
  id: string;
  name: string;
  emoji: string;
  benefits: string[];
  ingredients: string[];
  usage: string;
  waLink: string;
}

const healthProducts: HealthProduct[] = [
  {
    id: "abc-malt",
    name: "A.B.C. Malt (Apple, Beetroot, Carrot)",
    emoji: "🍎",
    benefits: [
      "Rich in natural antioxidants and Vitamin C",
      "Purifies blood and enhances natural skin glow",
      "Boosts energy and physical stamina naturally",
      "Helps maintain optimal hemoglobin levels",
    ],
    ingredients: ["Fresh Apple Extract", "Beetroot Extract", "Carrot Extract", "Premium Almonds", "Cashews", "Cardamom", "Natural Country Sugar"],
    usage: "Add 1-2 tablespoons of ABC Malt to a cup of warm milk or water. Stir well. No need to boil. Drink warm.",
    waLink: "https://wa.me/919003860616?text=Hi%20Kayal%20Samayal!%20I'd%2520like%2520to%2520order%2520ABC%2520Malt.",
  },
  {
    id: "golden-milk",
    name: "Golden Milk Magic (Immunity Turmeric Mix)",
    emoji: "🥛",
    benefits: [
      "Promotes strong immunity and infection resistance",
      "Soothes sore throats, cold, and respiratory blockages",
      "Improves natural sleep cycle and digestion",
      "Anti-inflammatory properties from curcumin-rich turmeric",
    ],
    ingredients: ["Curcumin Turmeric", "Black Pepper", "Dry Ginger (Sukku)", "Cardamom", "Ayurvedic Herbs"],
    usage: "Mix 1/2 teaspoon into a cup of hot milk. Boil for 1-2 minutes. Sweeten with country sugar or honey. Drink warm before sleep.",
    waLink: "https://wa.me/919003860616?text=Hi%20Kayal%20Samayal!%20I'd%2520like%2520to%2520order%2520Golden%2520Milk%2520Magic.",
  },
  {
    id: "kavunirich",
    name: "Kavunirich (Black Rice Health Mix)",
    emoji: "🌾",
    benefits: [
      "Loaded with anthocyanin antioxidants",
      "High dietary fiber content aids digestion",
      "Regulates blood pressure and metabolic rate",
      "Maintains cardiovascular health",
    ],
    ingredients: ["Traditional Kavuni Rice", "Mapillai Samba Rice", "Whole Grains", "Cardamom"],
    usage: "Add 2 tablespoons to water or buttermilk. Boil on low-medium flame for 5 minutes, stirring continuously. Serve as warm porridge.",
    waLink: "https://wa.me/919003860616?text=Hi%20Kayal%20Samayal!%20I'd%2520like%2520to%2520order%2520Kavunirich.",
  },
  {
    id: "sukku-coffee",
    name: "Sukku Malli Herbal Kaafi",
    emoji: "☕",
    benefits: [
      "Provides instant relief from headaches, cold, and cough",
      "Aids digestion and neutralizes acidity",
      "Caffeine-free natural body energizer",
      "Flushes out toxins from the liver",
    ],
    ingredients: ["Dry Ginger (Sukku)", "Coriander Seeds (Malli)", "Black Pepper", "Cardamom", "Natural Herbs"],
    usage: "Boil 1 teaspoon of Sukku Malli powder with a cup of water and palm jaggery for 3-5 minutes. Filter and drink hot.",
    waLink: "https://wa.me/919003860616?text=Hi%20Kayal%20Samayal!%20I'd%2520like%2520to%2520order%2520Sukku%2520Malli%2520Kaafi.",
  },
  {
    id: "slim-sakthi",
    name: "Slim Sakthi (Weight Management Mix)",
    emoji: "🥗",
    benefits: [
      "Enhances body metabolism and burns fat naturally",
      "Suppresses unhealthy sweet cravings",
      "Improves digestion and bowel movement",
      "Low glycemic index keeps you full longer",
    ],
    ingredients: ["Roasted Millets", "Horsegram", "Flax Seeds", "Fenugreek", "Digestive Spices"],
    usage: "Mix 2 spoons of Slim Sakthi in warm water or thin buttermilk. Drink twice daily before main meals.",
    waLink: "https://wa.me/919003860616?text=Hi%20Kayal%20Samayal!%20I'd%2520like%2520to%2520order%2520Slim%2520Sakthi.",
  },
];

export default function HealthMixesInteractive() {
  const [activeTab, setActiveTab] = useState<string>("abc-malt");

  return (
    <section className="py-16 sm:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Desktop layout: Left Tabs, Right detailed panels */}
      <div className="hidden lg:grid grid-cols-12 gap-8 items-start">
        {/* Sidebar tabs */}
        <div className="col-span-4 bg-white border border-cream-300 rounded-2xl p-4 shadow-xs space-y-2">
          {healthProducts.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveTab(p.id)}
              className={`w-full text-left font-display font-bold text-sm sm:text-base px-4 py-3 rounded-xl transition-all duration-300 flex items-center gap-3 cursor-pointer ${
                activeTab === p.id
                  ? "bg-brand-purple text-cream-50 shadow-sm"
                  : "bg-transparent text-espresso-900 hover:bg-cream-200/40"
              }`}
            >
              <span className="text-xl select-none">{p.emoji}</span>
              <span>{p.name.split(" (")[0]}</span>
            </button>
          ))}
        </div>

        {/* Detailed panel */}
        <div className="col-span-8 bg-white border border-cream-300 rounded-2xl p-8 shadow-md min-h-[400px] flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {healthProducts.map((p) => {
              if (p.id !== activeTab) return null;
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-4 border-b border-cream-200 pb-4">
                    <span className="text-4xl filter drop-shadow-sm select-none">{p.emoji}</span>
                    <h2 className="font-display font-extrabold text-brand-purple text-xl sm:text-2xl">
                      {p.name}
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    {/* Left: Benefits */}
                    <div className="space-y-3">
                      <h3 className="font-body text-xs font-bold uppercase tracking-wider text-brand-orange flex items-center gap-1.5">
                        <Heart size={14} className="text-brand-orange" /> Key Health Benefits
                      </h3>
                      <ul className="space-y-2.5">
                        {p.benefits.map((b, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle size={14} className="text-brand-orange shrink-0 mt-0.5" />
                            <span className="font-body text-espresso-900 text-sm leading-relaxed">{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Right: Ingredients & Usage */}
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <h3 className="font-body text-xs font-bold uppercase tracking-wider text-brand-orange flex items-center gap-1.5">
                          <Sparkles size={14} className="text-brand-orange" /> Main Ingredients
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {p.ingredients.map((ing, idx) => (
                            <span key={idx} className="bg-cream-100 border border-cream-200 text-brand-purple font-body text-[0.7rem] sm:text-xs font-semibold px-2.5 py-1 rounded-md">
                              {ing}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-body text-xs font-bold uppercase tracking-wider text-brand-orange flex items-center gap-1.5">
                          <ShieldCheck size={14} className="text-brand-orange" /> Usage Instructions
                        </h3>
                        <p className="font-body text-espresso-800 text-xs sm:text-sm leading-relaxed">
                          {p.usage}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-cream-200 flex justify-end">
                    <a
                      href={p.waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary text-sm font-bold min-h-[44px]"
                    >
                      <MessageCircle size={16} /> Order on WhatsApp
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile/Tablet layout: Vertical Accordion list */}
      <div className="lg:hidden space-y-4">
        {healthProducts.map((p) => {
          const isOpen = activeTab === p.id;
          return (
            <div key={p.id} className="bg-white border border-cream-300 rounded-xl shadow-xs overflow-hidden">
              <button
                onClick={() => setActiveTab(isOpen ? "" : p.id)}
                className="w-full text-left font-display font-extrabold text-brand-purple text-base sm:text-lg px-5 py-4 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl filter drop-shadow-sm select-none">{p.emoji}</span>
                  <span>{p.name.split(" (")[0]}</span>
                </div>
                <span className="text-xl font-body font-bold text-brand-orange">{isOpen ? "−" : "+"}</span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 border-t border-cream-200 pt-4 space-y-5 bg-cream-50/20">
                      {/* Benefits */}
                      <div className="space-y-2">
                        <h4 className="font-body text-xs font-bold uppercase tracking-wider text-brand-orange flex items-center gap-1.5">
                          <Heart size={14} /> Benefits
                        </h4>
                        <ul className="space-y-2">
                          {p.benefits.map((b, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle size={14} className="text-brand-orange shrink-0 mt-0.5" />
                              <span className="font-body text-espresso-900 text-xs sm:text-sm leading-relaxed">{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Ingredients */}
                      <div className="space-y-2">
                        <h4 className="font-body text-xs font-bold uppercase tracking-wider text-brand-orange flex items-center gap-1.5">
                          <Sparkles size={14} /> Ingredients
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {p.ingredients.map((ing, idx) => (
                            <span key={idx} className="bg-white border border-cream-300 text-brand-purple font-body text-[0.7rem] px-2 py-0.5 rounded-md font-semibold">
                              {ing}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Usage */}
                      <div className="space-y-2">
                        <h4 className="font-body text-xs font-bold uppercase tracking-wider text-brand-orange flex items-center gap-1.5">
                          <ShieldCheck size={14} /> Usage
                        </h4>
                        <p className="font-body text-espresso-800 text-xs leading-relaxed">
                          {p.usage}
                        </p>
                      </div>

                      {/* WhatsApp order link */}
                      <div className="pt-4 border-t border-cream-200">
                        <a
                          href={p.waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary w-full justify-center text-xs font-bold py-3 px-4 flex items-center gap-1.5 min-h-[44px]"
                        >
                          <MessageCircle size={14} /> Order on WhatsApp
                        </a>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
