/**
 * Classifieur de catégories — Open Food Facts taxonomy v3
 * Multi-catégories : un produit peut appartenir à plusieurs catégories simultanément.
 */

export type CategoryType =
  | "viandes"
  | "laitiers"
  | "legumes"
  | "boissons"
  | "congelés"
  | "boulangerie"
  | "féculents"
  | "sucreries"
  | "condiments"
  | "plats"
  | "autre";

export interface CategoryStyle {
  icon: string;
  color: string;
  iconCol: string;
  // La catégorie "principale" pour l'affichage de l'icône/couleur
  type: CategoryType;
  // Toutes les catégories du produit (pour le filtrage multi-onglets)
  types: CategoryType[];
}

export const CATEGORY_STYLES: Record<CategoryType, Omit<CategoryStyle, "types">> = {
  viandes: { icon: "shopping-bag", color: "#FFEBEE", iconCol: "#EF5350", type: "viandes" },
  laitiers: { icon: "package", color: "#FFF9C4", iconCol: "#FBC02D", type: "laitiers" },
  legumes: { icon: "leaf", color: "#E8F5E9", iconCol: "#4CAF50", type: "legumes" },
  boissons: { icon: "droplet", color: "#E3F2FD", iconCol: "#2196F3", type: "boissons" },
  congelés: { icon: "wind", color: "#E0F7FA", iconCol: "#00ACC1", type: "congelés" },
  boulangerie: { icon: "sun", color: "#FFF3E0", iconCol: "#FB8C00", type: "boulangerie" },
  féculents: { icon: "layers", color: "#F3E5F5", iconCol: "#8E24AA", type: "féculents" },
  sucreries: { icon: "heart", color: "#FCE4EC", iconCol: "#E91E63", type: "sucreries" },
  condiments: { icon: "thermometer", color: "#EFEBE9", iconCol: "#6D4C41", type: "condiments" },
  plats: { icon: "coffee", color: "#F1F8E9", iconCol: "#7CB342", type: "plats" },
  autre: { icon: "box", color: "#F5F5F5", iconCol: "#757575", type: "autre" },
};

// Ordre de priorité pour choisir l'icône/couleur principale uniquement
const PRIORITY: CategoryType[] = [
  "viandes",
  "laitiers",
  "congelés",
  "legumes",
  "boissons",
  "plats",
  "boulangerie",
  "sucreries",
  "féculents",
  "condiments",
];

function normalizeKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^[a-z]{2,3}:/, "")
    .replace(/\s+/g, "-");
}

function extractKeys(field: unknown): string[] {
  if (!field) return [];
  return String(field)
    .replace(/[\[\]"]/g, "")
    .split(/[,|;\s]+/)
    .flatMap((part) => {
      const full = part.trim().toLowerCase();
      const slug = normalizeKey(part);
      return full && slug && full !== slug ? [full, slug] : full ? [full] : [];
    });
}

export function getCategoryStyle(
  item: Record<string, unknown>,
  lookup: Record<string, string>,
): CategoryStyle {
  const keys = [...extractKeys(item.categories_hierarchy), ...extractKeys(item.categories_tags)];

  const found = new Set<CategoryType>();

  // Détection directe "frozen"/"surgel" → congelés dans tous les cas
  const allText = keys.join(" ");
  if (allText.includes("frozen") || allText.includes("surgel")) {
    found.add("congelés");
  }

  for (const key of keys) {
    const cat = lookup[key] as CategoryType | undefined;
    if (cat) found.add(cat);
  }

  // Catégorie principale = première dans l'ordre de priorité
  const mainType = PRIORITY.find((cat) => found.has(cat)) ?? "autre";
  const types = found.size > 0 ? [...found] : ["autre" as CategoryType];

  return {
    ...CATEGORY_STYLES[mainType],
    types,
  };
}
