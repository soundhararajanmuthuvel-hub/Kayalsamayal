import * as fs from "fs";
import * as path from "path";
import { products } from "../src/data/products";

// Default pricing logic matching CartContext.tsx
function getProductPrice(category: string, tier: string): number {
  const isPremium = tier === "premium";
  switch (category) {
    case "Traditional Masalas":
      return isPremium ? 120 : 60;
    case "Podi Products":
      return isPremium ? 100 : 50;
    case "Specialty Noodles":
      return isPremium ? 140 : 80;
    case "Health Mixes & Malts":
      return isPremium ? 320 : 180;
    case "PeruKalam Legiyam":
      return 250;
    default:
      return 100;
  }
}

function escapeCSVField(field: any): string {
  if (field === null || field === undefined) return "";
  const str = String(field);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function generateCSV() {
  const headers = [
    "Product ID",
    "Product Name",
    "Category",
    "Tier",
    "Price",
    "MRP",
    "GST",
    "Stock",
    "Image",
    "Description",
    "Highlights",
    "Active"
  ];

  const rows = products.map((p) => {
    const price = getProductPrice(p.category, p.tier);
    const mrp = price; // Default MRP matches Price
    const gst = 0; // Default GST is 0
    const stock = 100; // Default active stock is 100
    const active = "TRUE";
    
    // JSON representation of Highlights to preserve structured metadata
    const highlightsStr = JSON.stringify(p.highlights);

    return [
      p.id,
      p.name,
      p.category,
      p.tier,
      price,
      mrp,
      gst,
      stock,
      p.image || "",
      p.description,
      highlightsStr,
      active
    ].map(escapeCSVField).join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\n");
  const exportPath = path.join(__dirname, "../products_export.csv");
  
  fs.writeFileSync(exportPath, csvContent, "utf8");
  
  console.log("==================================================");
  console.log("KAYAL SAMAYAL - PRODUCT SYNCHRONIZATION REPORT");
  console.log("==================================================");
  console.log(`Total local products processed: ${products.length}`);
  console.log(`CSV Export Location: ${exportPath}`);
  console.log("==================================================");
  
  // Categorized Breakdown
  const categoriesCount: Record<string, number> = {};
  products.forEach(p => {
    categoriesCount[p.category] = (categoriesCount[p.category] || 0) + 1;
  });
  console.log("Category breakdown:");
  Object.entries(categoriesCount).forEach(([cat, count]) => {
    console.log(` - ${cat}: ${count} products`);
  });

  const tierCount = { regular: 0, premium: 0 };
  products.forEach(p => {
    tierCount[p.tier]++;
  });
  console.log("Tier breakdown:");
  console.log(` - Regular: ${tierCount.regular} products`);
  console.log(` - Premium: ${tierCount.premium} products`);
  console.log("==================================================");
  console.log("INSTRUCTIONS FOR IMPORTING INTO GOOGLE SHEETS:");
  console.log("1. Open your Google Sheet.");
  console.log("2. Navigate to the 'Products' tab.");
  console.log("3. Select File > Import.");
  console.log("4. Upload the generated 'products_export.csv' file.");
  console.log("5. Choose 'Replace current sheet' or clear old rows and import.");
  console.log("==================================================");
}

generateCSV();
