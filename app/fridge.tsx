import db from "@/app/database/database";
import { Feather } from "@expo/vector-icons";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const getCategoryStyle = (item) => {
  const hierarchy = (item.categories_hierarchy || "").toString().toLowerCase();
  const tags = (item.categories_tags || "").toString().toLowerCase();
  const name = (item.nom_produit || "").toLowerCase();
  const searchZone = `${hierarchy} ${tags} ${name}`;

  if (
    searchZone.includes("spreads") ||
    searchZone.includes("nutella") ||
    searchZone.includes("jam") ||
    searchZone.includes("confiture") ||
    searchZone.includes("honey") ||
    searchZone.includes("miel")
  ) {
    return { icon: "box", color: "#F5F5F5", iconCol: "#757575", type: "autre" };
  }

  if (
    searchZone.includes("meats") ||
    searchZone.includes("viande") ||
    searchZone.includes("fish") ||
    searchZone.includes("poisson") ||
    searchZone.includes("charcuterie") ||
    searchZone.includes("poulet") ||
    searchZone.includes("chicken") ||
    searchZone.includes("steak")
  ) {
    return { icon: "shopping-bag", color: "#FFEBEE", iconCol: "#EF5350", type: "viande" };
  }

  if (
    searchZone.includes("dairies") ||
    searchZone.includes("laitier") ||
    searchZone.includes("cheese") ||
    searchZone.includes("fromage") ||
    searchZone.includes("yogurt") ||
    searchZone.includes("yaourt") ||
    searchZone.includes("lait") ||
    searchZone.includes("emmental") ||
    searchZone.includes("beurre")
  ) {
    return { icon: "package", color: "#FFF9C4", iconCol: "#FBC02D", type: "laitiers" };
  }

  if (
    searchZone.includes("beverages") ||
    searchZone.includes("boisson") ||
    searchZone.includes("eau") ||
    searchZone.includes("water") ||
    searchZone.includes("soda") ||
    searchZone.includes("cola") ||
    searchZone.includes("juice") ||
    searchZone.includes("jus") ||
    searchZone.includes("drink")
  ) {
    return { icon: "droplet", color: "#E3F2FD", iconCol: "#2196F3", type: "boissons" };
  }

  if (
    searchZone.includes("plant-based") ||
    searchZone.includes("vegetable") ||
    searchZone.includes("legume") ||
    searchZone.includes("fruit") ||
    searchZone.includes("salade")
  ) {
    return { icon: "leaf", color: "#E8F5E9", iconCol: "#4CAF50", type: "legumes" };
  }

  return { icon: "box", color: "#F5F5F5", iconCol: "#757575", type: "autre" };
};

export default function FridgeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { cat } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tous");
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (cat) {
      setActiveTab(cat as string);
    }
  }, [cat]);

  const getDaysRemaining = (expiryDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const result = await db.getAllAsync(
        "SELECT * FROM produits WHERE statut = 'dans_le_frigo' ORDER BY date_peremption ASC",
      );

      const processedItems = result.map((item) => {
        const style = getCategoryStyle(item);
        return {
          ...item,
          daysLeft: getDaysRemaining(item.date_peremption),
          categoryType: style.type,
          style: style,
        };
      });

      setItems(processedItems);
    } catch (error) {
      console.error("Erreur SQL:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const filteredItems = items.filter(
    (item) => activeTab === "tous" || item.categoryType === activeTab,
  );

  const urgentItems = filteredItems.filter((i) => i.daysLeft <= 3);
  const otherItems = filteredItems.filter((i) => i.daysLeft > 3);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#1B5E20" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Link href="/" replace asChild>
          <TouchableOpacity style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#1B5E20" />
          </TouchableOpacity>
        </Link>
        <Text style={styles.headerTitle}>Mon Inventaire</Text>
        <Link href="/scan" replace asChild>
          <TouchableOpacity style={styles.addButton}>
            <Feather name="plus" size={24} color="#1B5E20" />
          </TouchableOpacity>
        </Link>
      </View>

      <View style={styles.tabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}
        >
          <TabItem id="tous" label="Tout" active={activeTab} onPress={setActiveTab} />
          {/* NOUVEAU BOUTON VIANDE & POISSON */}
          <TabItem id="viande" label="🥩 Viandes" active={activeTab} onPress={setActiveTab} />
          <TabItem id="laitiers" label="🥛 Laitiers" active={activeTab} onPress={setActiveTab} />
          <TabItem id="legumes" label="🥬 Légumes" active={activeTab} onPress={setActiveTab} />
          <TabItem id="boissons" label="💧 Boissons" active={activeTab} onPress={setActiveTab} />
          <TabItem id="autre" label="📦 Autres" active={activeTab} onPress={setActiveTab} />
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {urgentItems.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>⚠️ À consommer d'urgence</Text>
            {urgentItems.map((item) => (
              <InventoryItem key={item.id} item={item} router={router} />
            ))}
          </>
        )}

        <Text style={styles.sectionTitle}>Reste du stock</Text>
        {otherItems.length > 0 ? (
          otherItems.map((item) => <ListItem key={item.id} item={item} router={router} />)
        ) : (
          <Text style={styles.emptyText}>Aucun produit dans cette catégorie.</Text>
        )}
      </ScrollView>
    </View>
  );
}

// --- SOUS-COMPOSANTS ---

const TabItem = ({ id, label, active, onPress }) => (
  <TouchableOpacity
    style={[styles.tabButton, active === id && styles.tabButtonActive]}
    onPress={() => onPress(id)}
  >
    <Text style={[styles.tabLabel, active === id && styles.tabLabelActive]}>{label}</Text>
  </TouchableOpacity>
);

const InventoryItem = ({ item, router }) => (
  <TouchableOpacity
    style={[
      styles.urgentCard,
      { backgroundColor: item.daysLeft <= 1 ? "#FFCDD2" : item.style.color },
    ]}
    onPress={() => router.replace({ pathname: "/product", params: { id: item.id } })}
  >
    <View style={styles.iconCircle}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.miniImage} resizeMode="contain" />
      ) : (
        <Feather name={item.style.icon} size={20} color={item.style.iconCol} />
      )}
    </View>
    <View style={styles.urgentInfo}>
      <Text style={styles.urgentName} numberOfLines={1}>
        {item.nom_produit}
      </Text>
      <Text style={styles.urgentBrand} numberOfLines={1}>
        {item.marque || "Marque inconnue"}
      </Text>
    </View>
    <View style={styles.daysBadge}>
      <Text
        style={[styles.daysText, { color: item.daysLeft <= 0 ? "#D32F2F" : item.style.iconCol }]}
      >
        {item.daysLeft <= 0 ? "Expiré" : `${item.daysLeft}j`}
      </Text>
    </View>
  </TouchableOpacity>
);

const ListItem = ({ item, router }) => (
  <TouchableOpacity
    style={styles.menuItem}
    onPress={() => router.replace({ pathname: "/product", params: { id: item.id } })}
  >
    <View style={[styles.menuIconContainer, { backgroundColor: item.style.color }]}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.miniImage} resizeMode="contain" />
      ) : (
        <Feather name={item.style.icon} size={20} color={item.style.iconCol} />
      )}
    </View>
    <View style={styles.menuTextContainer}>
      <Text style={styles.menuTitle} numberOfLines={1}>
        {item.nom_produit}
      </Text>
      <Text style={styles.menuSub} numberOfLines={1}>
        {item.marque} • {item.quantite_brute}
      </Text>
    </View>
    <Text style={styles.daysTextList}>{item.daysLeft}j</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#333" },
  backButton: { backgroundColor: "#F5F5F5", padding: 10, borderRadius: 12 },
  addButton: { backgroundColor: "#E8F5E9", padding: 10, borderRadius: 12 },
  tabContainer: { marginVertical: 10 },
  tabScroll: { paddingHorizontal: 20, gap: 10 },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#EEE",
  },
  tabButtonActive: { backgroundColor: "#1B5E20", borderColor: "#1B5E20" },
  tabLabel: { fontSize: 14, fontWeight: "700", color: "#666" },
  tabLabelActive: { color: "#FFF" },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#333", marginTop: 15, marginBottom: 15 },
  urgentCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 22,
    marginBottom: 12,
  },
  iconCircle: {
    backgroundColor: "white",
    width: 44,
    height: 44,
    borderRadius: 14,
    marginRight: 15,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  miniImage: { width: "100%", height: "100%" },
  urgentInfo: { flex: 1 },
  urgentName: { fontSize: 16, fontWeight: "700", color: "#333" },
  urgentBrand: { fontSize: 12, color: "#666" },
  daysBadge: {
    backgroundColor: "rgba(255,255,255,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  daysText: { fontWeight: "800", fontSize: 12 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F8F8F8",
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    marginRight: 15,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  menuTextContainer: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: "700", color: "#333" },
  menuSub: { fontSize: 12, color: "#999", marginTop: 2 },
  daysTextList: { fontWeight: "700", color: "#666", marginRight: 5 },
  emptyText: {
    color: "#AAA",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 30,
    fontSize: 14,
  },
});
