export type CategoryType =
  | "viandes"
  | "laitiers"
  | "legumes"
  | "boissons"
  | "condiments"
  | "autre";

export interface CategoryStyle {
  icon: string;
  color: string;
  iconCol: string;
  type: CategoryType;
  types: CategoryType[];
}

export const CATEGORY_STYLES: Record<CategoryType, Omit<CategoryStyle, "types">> = {
  viandes: { icon: "shopping-bag", color: "#FFEBEE", iconCol: "#EF5350", type: "viandes" },
  laitiers: { icon: "package", color: "#FFF9C4", iconCol: "#FBC02D", type: "laitiers" },
  legumes: { icon: "leaf", color: "#E8F5E9", iconCol: "#4CAF50", type: "legumes" },
  boissons: { icon: "droplet", color: "#E3F2FD", iconCol: "#2196F3", type: "boissons" },
  condiments: { icon: "thermometer", color: "#EFEBE9", iconCol: "#6D4C41", type: "condiments" },
  autre: { icon: "box", color: "#F5F5F5", iconCol: "#757575", type: "autre" },
};

const PRIORITY: CategoryType[] = [
  "viandes",
  "laitiers",
  "legumes",
  "boissons",
  "condiments",
];

function extractText(field: unknown): string {
  if (!field) return "";
  let text = String(field).toLowerCase();
  
  // Enlever les accents
  text = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  // Remplacer ponctuation/tirets par des espaces
  text = text.replace(/[^a-z0-9]/g, " ");
  text = ` ${text} `.replace(/\s+/g, " ");
  
  // CORRECTION : On ratisse large pour amputer le mot "boissons" de toutes 
  // les macro-catégories végétales, qu'elles soient aux légumes, fruits ou végétaux.
  text = text.replace(/ plant based foods and beverages /g, " plant based foods ");
  text = text.replace(/ aliments et boissons a base de /g, " aliments a base de ");
  
  return text;
}

function hasKeyword(text: string, includes: string[], excludes: string[] = []): boolean {
  const matchWord = (kw: string) => 
    text.includes(` ${kw} `) || 
    text.includes(` ${kw}s `) || 
    text.includes(` ${kw}x `);
  
  if (!includes.some(matchWord)) return false;
  return !excludes.some(matchWord);
}

export function getCategoryStyle(item: Record<string, unknown>): CategoryStyle {
  // Fusion totale : tags de catégories + noms du produit
  const allText = extractText(item.categories_hierarchy) + 
                  extractText(item.categories_tags) + 
                  extractText(item.product_name) + 
                  extractText(item.product_name_fr);

  const found = new Set<CategoryType>();

  // --- VIANDES ---
  if (hasKeyword(
    allText, 
    ["meat", "viande", "beef", "boeuf", "chicken", "poulet", "pork", "porc", "sausage", "saucisse"], 
    ["vegan", "vegetalien", "vegetarien", "vegetarian", "meat free", "plant based"]
  )) {
    found.add("viandes");
  }

  // --- LAITIERS ---
  if (hasKeyword(
    allText, 
    ["dairy", "dairies", "laitier", "milk", "lait", "cheese", "fromage", "butter", "beurre", "yogurt", "yaourt", "cream", "creme"], 
    ["vegan", "vegetalien", "soy", "soja", "almond", "amande", "oat", "avoine", "coconut", "coco", "rice", "riz", "plant based"]
  )) {
    found.add("laitiers");
  }

  // --- FRUITS ET LÉGUMES ---
  if (hasKeyword(
    allText, 
    ["fruit", "vegetable", "legume", "apple", "pomme", "salad", "salade", "tomato", "tomate", "carrot", "carotte"], 
    ["candy", "bonbon", "syrup", "sirop", "juice", "jus", "nectar", "smoothie", "compote", "jam", "confiture", "marmalade", "puree", "mash", "soup", "soupe", "veloute", "sauce", "ketchup", "extract", "extrait", "aroma", "arome", "concentrate", "concentre", "canned", "conserve", "tin", "chip", "dried", "seche"]
  )) {
    found.add("legumes");
  }

  // --- BOISSONS ---
  if (hasKeyword(
    allText, 
    ["beverage", "drink", "boisson", "juice", "jus", "water", "eau", "soda", "tea", "the", "coffee", "cafe"],
    // CORRECTION : Ajout des conserves et concentrés aux exclusions
    ["compote", "puree", "mash", "jam", "confiture", "marmalade", "sauce", "concentrate", "concentre", "canned", "conserve", "tin"]
  )) {
    found.add("boissons");
  }

  // --- CONDIMENTS ---
  if (hasKeyword(
    allText, 
    ["condiment", "sauce", "spice", "epice", "mustard", "moutarde", "ketchup", "mayonnaise", "dressing"]
  )) {
    found.add("condiments");
  }

  const mainType = PRIORITY.find((cat) => found.has(cat)) ?? "autre";
  const types = found.size > 0 ? [...found] : ["autre" as CategoryType];

  return {
    ...CATEGORY_STYLES[mainType],
    types,
  };
}