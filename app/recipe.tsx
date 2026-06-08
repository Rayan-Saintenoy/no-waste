import { Feather } from "@expo/vector-icons";
import { Link } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function RecipesScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header (Même structure que Profile) */}
      <View style={styles.header}>
        <Link href="/" asChild>
          <TouchableOpacity style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#1B5E20" />
          </TouchableOpacity>
        </Link>
        <Text style={styles.headerTitle}>Idées Recettes</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Feather name="search" size={20} color="#1B5E20" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* En-tête de motivation */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Prêt à sauver des repas ? 🥗</Text>
          <Text style={styles.heroSubtitle}>
            Voici ce que vous pouvez cuisiner avec vos produits qui expirent bientôt.
          </Text>
        </View>

        {/* Section 1 : Les Recettes "Sauvetage" (Grandes Cartes) */}
        <Text style={styles.sectionTitle}>🔥 À cuisiner d'urgence</Text>

        <RecipeHeroCard
          title="Gratin de Jambon & Fromage"
          time="20 min"
          difficulty="Facile"
          savedCount={2}
          color="#FFE0B2" // Orange pastel
        />

        <RecipeHeroCard
          title="Velouté de Légumes"
          time="15 min"
          difficulty="Très facile"
          savedCount={3}
          color="#E8F5E9" // Vert pastel
        />

        {/* Section 2 : Par Catégorie (Format Grille Pastel comme l'accueil) */}
        <Text style={styles.sectionTitle}>Par Type de Plat</Text>
        <View style={styles.categoriesGrid}>
          <View style={[styles.miniCategory, { backgroundColor: "#E3F2FD" }]}>
            <Feather name="sun" size={20} color="#2196F3" />
            <Text style={styles.miniCategoryText}>Petit-dej</Text>
          </View>
          <View style={[styles.miniCategory, { backgroundColor: "#F3E5F5" }]}>
            <Feather name="coffee" size={20} color="#9C27B0" />
            <Text style={styles.miniCategoryText}>Desserts</Text>
          </View>
          <View style={[styles.miniCategory, { backgroundColor: "#FFF3E0" }]}>
            <Feather name="zap" size={20} color="#FF9800" />
            <Text style={styles.miniCategoryText}>Rapide</Text>
          </View>
        </View>

        {/* Section 3 : Toutes les idées (Style Liste Propre) */}
        <Text style={styles.sectionTitle}>Découvrir plus</Text>
        <View style={styles.listContainer}>
          <RecipeRowItem title="Omelette aux fines herbes" time="10 min" xp="Pauvre en gaspi" />
          <RecipeRowItem title="Salade de fruits frais" time="5 min" xp="Zéro déchet" />
          <RecipeRowItem title="Pasta à la crème" time="15 min" xp="Top économie" />
        </View>
      </ScrollView>
    </View>
  );
}

// COMPOSANTS INTERNES
const RecipeHeroCard = ({ title, time, difficulty, savedCount, color }) => (
  <TouchableOpacity style={[styles.heroCard, { backgroundColor: color }]}>
    <View style={styles.heroCardContent}>
      <View style={styles.badgeSauvetage}>
        <Text style={styles.badgeText}>Sauve {savedCount} produits</Text>
      </View>
      <Text style={styles.heroCardTitle}>{title}</Text>
      <View style={styles.heroCardFooter}>
        <View style={styles.footerInfo}>
          <Feather name="clock" size={14} color="#666" />
          <Text style={styles.footerText}>{time}</Text>
        </View>
        <View style={styles.footerInfo}>
          <Feather name="bar-chart" size={14} color="#666" />
          <Text style={styles.footerText}>{difficulty}</Text>
        </View>
      </View>
    </View>
    <View style={styles.imagePlaceholder}>
      <Feather name="image" size={30} color="rgba(0,0,0,0.1)" />
    </View>
  </TouchableOpacity>
);

const RecipeRowItem = ({ title, time, xp }) => (
  <TouchableOpacity style={styles.rowItem}>
    <View style={styles.rowText}>
      <Text style={styles.rowTitle}>{title}</Text>
      <Text style={styles.rowSub}>
        {time} • {xp}
      </Text>
    </View>
    <Feather name="chevron-right" size={20} color="#CCC" />
  </TouchableOpacity>
);

// STYLES
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
  filterButton: { backgroundColor: "#E8F5E9", padding: 10, borderRadius: 12 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  heroSection: { marginVertical: 10 },
  heroTitle: { fontSize: 22, fontWeight: "800", color: "#1B5E20" },
  heroSubtitle: { fontSize: 14, color: "#666", marginTop: 5, lineHeight: 20 },

  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#333", marginTop: 30, marginBottom: 15 },

  // Hero Card Style
  heroCard: {
    flexDirection: "row",
    borderRadius: 24,
    padding: 20,
    marginBottom: 15,
    alignItems: "center",
    overflow: "hidden",
  },
  heroCardContent: { flex: 1 },
  badgeSauvetage: {
    backgroundColor: "white",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 10,
  },
  badgeText: { fontSize: 11, fontWeight: "800", color: "#2E7D32" },
  heroCardTitle: { fontSize: 18, fontWeight: "700", color: "#333", marginBottom: 12 },
  heroCardFooter: { flexDirection: "row" },
  footerInfo: { flexDirection: "row", alignItems: "center", marginRight: 15 },
  footerText: { fontSize: 12, color: "#666", marginLeft: 5, fontWeight: "600" },
  imagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: "rgba(255,255,255,0.4)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  // Grid
  categoriesGrid: { flexDirection: "row", justifyContent: "space-between" },
  miniCategory: { width: "31%", padding: 15, borderRadius: 20, alignItems: "center" },
  miniCategoryText: { fontSize: 11, fontWeight: "700", marginTop: 8, color: "#333" },

  // List
  listContainer: { backgroundColor: "#F9F9F9", borderRadius: 24, padding: 10 },
  rowItem: { flexDirection: "row", alignItems: "center", padding: 15 },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: "600", color: "#333" },
  rowSub: { fontSize: 12, color: "#888", marginTop: 2 },
});
