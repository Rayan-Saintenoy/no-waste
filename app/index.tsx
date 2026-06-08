import db from "@/app/database/database";
import { Link, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

// IMPORT DES ICONES LOGIQUES
import { Beef, Carrot, ChevronRight, CupSoda, Maximize, Milk, User } from "lucide-react-native";

function HomeScreenContent() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ urgentCount: 0 });
  const [recentProducts, setRecentProducts] = useState([]);
  const [firstname, setFirstname] = useState();

  const loadHomeData = useCallback(async () => {
    try {
      setLoading(true);
      const userInfo = await db.getFirstAsync("SELECT * FROM utilisateur");
      const countResult = await db.getFirstAsync(
        "SELECT COUNT(*) as total FROM produits WHERE date_peremption <= date('now', '+3 days') AND statut = 'dans_le_frigo'",
      );
      const recentResult = await db.getAllAsync(
        "SELECT id, nom_produit, date_peremption, image_url FROM produits WHERE statut = 'dans_le_frigo' ORDER BY id DESC LIMIT 3",
      );

      setFirstname(userInfo?.firstname || "Utilisateur");
      setStats({ urgentCount: countResult?.total || 0 });
      setRecentProducts(recentResult);
    } catch (error) {
      console.error("Erreur Home Data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, [loadHomeData]),
  );

  const getDaysRemaining = (expiryDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 100 },
        ]}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonjour {firstname} 👋</Text>
            <Text style={styles.title}>Mon Frigo NoWaste</Text>
          </View>
          <Link href="/profile" replace asChild>
            <TouchableOpacity style={styles.profileButton}>
              <User size={24} color="#2E7D32" />
            </TouchableOpacity>
          </Link>
        </View>

        {/* Alerte */}
        <View style={styles.alertContainer}>
          <Link href="/fridge" replace asChild>
            <TouchableOpacity style={styles.alertCard} activeOpacity={0.9}>
              <View style={styles.alertTextContainer}>
                <Text style={styles.alertNumber}>{stats.urgentCount}</Text>
                <Text style={styles.alertLabel}>Produits à consommer d'urgence</Text>
              </View>
              <View style={styles.alertButton}>
                <Text style={styles.alertButtonText}>Voir tout</Text>
              </View>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Section Catégories - ENFIN LOGIQUE */}
        <Text style={styles.sectionTitle}>Mes Catégories</Text>
        <View style={styles.categoriesGrid}>
          <CategoryCard
            href="/fridge?cat=viande"
            IconComponent={Beef}
            name="Viandes"
            color="#F3E5F5"
            iconCol="#b02727"
          />
          <CategoryCard
            href="/fridge?cat=laitiers"
            IconComponent={Milk}
            name="Laitiers"
            color="#E3F2FD"
            iconCol="#2196F3"
          />
          <CategoryCard
            href="/fridge?cat=legumes"
            IconComponent={Carrot}
            name="Légumes"
            color="#E8F5E9"
            iconCol="#2E7D32"
          />
          <CategoryCard
            href="/fridge?cat=boissons"
            IconComponent={CupSoda}
            name="Boissons"
            color="#FFF3E0"
            iconCol="#FF9800"
          />
        </View>

        {/* ... Reste de la liste ... */}
        <Text style={styles.sectionTitle}>Ajoutés récemment</Text>
        {recentProducts.map((item) => (
          <FoodItem
            key={item.id}
            id={item.id}
            name={item.nom_produit}
            image={item.image_url}
            days={getDaysRemaining(item.date_peremption)}
            color={getDaysRemaining(item.date_peremption) <= 2 ? "#FFCDD2" : "#E8F5E9"}
          />
        ))}
      </ScrollView>

      <View
        style={[styles.scanButtonContainer, { bottom: insets.bottom + 20 }]}
        pointerEvents="box-none"
      >
        <Link href="/scan" replace asChild>
          <TouchableOpacity style={styles.scanButton} activeOpacity={0.8}>
            <Maximize size={24} color="white" />
            <Text style={styles.scanButtonText}>Scanner un produit</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

// COMPOSANT CATEGORYCARD MODIFIÉ
const CategoryCard = ({ href, IconComponent, name, color, iconCol }) => (
  <Link href={href} replace asChild>
    <TouchableOpacity style={[styles.categoryCard, { backgroundColor: color }]}>
      <View style={styles.iconCircle}>
        <IconComponent size={22} color={iconCol} />
      </View>
      <Text style={styles.categoryName}>{name}</Text>
    </TouchableOpacity>
  </Link>
);

const FoodItem = ({ id, name, days, color, image }) => (
  <Link href={{ pathname: "/product", params: { id } }} replace asChild>
    <TouchableOpacity style={styles.foodItem}>
      <View style={[styles.foodIconContainer, { backgroundColor: color }]}>
        {image ? (
          <Image source={{ uri: image }} style={styles.foodImage} />
        ) : (
          <View style={styles.logoMiniature} />
        )}
      </View>
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{name}</Text>
        <Text style={styles.foodDays}>Périme dans {days} jours</Text>
      </View>
      <ChevronRight size={20} color="#CCC" />
    </TouchableOpacity>
  </Link>
);

export default function App() {
  return (
    <SafeAreaProvider>
      <HomeScreenContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContent: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
  },
  greeting: { fontSize: 16, color: "#888" },
  title: { fontSize: 24, fontWeight: "800", color: "#1B5E20" },
  profileButton: { backgroundColor: "#E8F5E9", padding: 10, borderRadius: 15 },
  alertContainer: { marginVertical: 10 },
  alertCard: {
    backgroundColor: "#2E7D32",
    borderRadius: 25,
    padding: 22,
    flexDirection: "row",
    alignItems: "center",
  },
  alertTextContainer: { flex: 1 },
  alertNumber: { color: "white", fontSize: 36, fontWeight: "bold" },
  alertLabel: { color: "white", fontSize: 14, fontWeight: "600" },
  alertButton: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 12,
  },
  alertButtonText: { color: "white", fontWeight: "700" },
  sectionTitle: { fontSize: 19, fontWeight: "800", marginTop: 25, marginBottom: 15, color: "#333" },
  categoriesGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  categoryCard: {
    width: "48%",
    padding: 20,
    borderRadius: 22,
    marginBottom: 15,
    alignItems: "center",
  },
  iconCircle: { backgroundColor: "white", padding: 10, borderRadius: 15 },
  categoryName: { marginTop: 10, fontWeight: "700", fontSize: 14 },
  foodItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F8F8F8",
  },
  foodIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    marginRight: 15,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  foodImage: { width: "100%", height: "100%" },
  foodInfo: { flex: 1 },
  foodName: { fontSize: 16, fontWeight: "700" },
  foodDays: { fontSize: 13, color: "#999" },
  scanButtonContainer: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1B5E20",
    paddingHorizontal: 30,
    paddingVertical: 18,
    borderRadius: 35,
  },
  scanButtonText: { color: "white", fontWeight: "800", marginLeft: 12 },
});
