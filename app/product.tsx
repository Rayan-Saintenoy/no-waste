import db from "@/app/database/database";
import { Feather } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker"; // Ajouté
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Product {
  code_barre: string;
  nom_produit: string;
  marque: string;
  image_url: string;
  quantite_brute: string;
  categories: string;
  categories_hierarchy: string;
  poids_kg: number;
  prix_achat: number;
  date_peremption: string;
  date_ajout: string;
  statut: string;
  image_path: string;
}

export default function ProductDetailScreen() {
  const [stats_price_enabled, setStats_price_enabled] = useState();

  const fetchUser = async () => {
    try {
      const result = await db.getFirstAsync(`SELECT stats_price_enabled FROM utilisateur LIMIT 1`);
      if (result) {
        setStats_price_enabled(result.stats_price_enabled);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des stats :", error);
    }
  };

  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const productId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : null;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  const [price, setPrice] = useState("");

  const loadProduct = async () => {
    if (!productId) return;
    try {
      const dbresult = await db.getFirstAsync("SELECT * FROM produits WHERE id = ?", [productId]);
      if (dbresult) {
        const result = dbresult as Product;
        setProduct(result);
        setTempDate(new Date(result.date_peremption));
      } else {
        Alert.alert("Erreur", "Produit introuvable dans la base de données.");
        router.back();
      }
    } catch (error) {
      console.error("Erreur SQL lors du chargement :", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    loadProduct();
  }, [id]);

  const onDateChange = (_event: DateTimePickerEvent, selectedDate: Date | undefined) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      if (selectedDate) {
        confirmDateUpdate(selectedDate);
      }
    } else if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const confirmDateUpdate = async (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    try {
      await db.runAsync("UPDATE produits SET date_peremption = ? WHERE id = ?", [
        dateStr,
        productId,
      ]);
      setShowDatePicker(false);
      loadProduct();
    } catch (error) {
      Alert.alert("Erreur", "Impossible de modifier la date.");
    }
  };

  const handleWasted = async () => {
    if (!product) return;

    try {
      await db.withTransactionAsync(async () => {
        await db.runAsync("DELETE FROM produits WHERE id = ?", [productId]);
      });

      if (!product.prix_achat || stats_price_enabled == 0) {
        Alert.alert(
          "Dommage ! 🥲",
          `Vous n'avez pas sauvé ${product.nom_produit}.\n${product.poids_kg}kg n'iras pas sur votre profils.`,
        );
      } else {
        Alert.alert(
          "Dommage ! 🥲",
          `Vous n'avez pas sauvé ${product.nom_produit}.\n${product.poids_kg}kg et ${product.prix_achat.toFixed(2)}€ n'irons pas sur votre profils.`,
        );
      }

      router.replace("/fridge");
    } catch (error) {
      console.error("Erreur lors de la transaction :", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de la mise à jour de vos statistiques.");
    }
  };

  const handleConsume = async () => {
    if (!product) return;

    try {
      await db.withTransactionAsync(async () => {
        await db.runAsync(
          `UPDATE utilisateur
           SET poids_total_sauve_kg = poids_total_sauve_kg + ?, 
               argent_total_sauve_eur = argent_total_sauve_eur + ? 
           WHERE id = 1`,
          [product.poids_kg || 0, product.prix_achat || 0],
        );

        await db.runAsync("DELETE FROM produits WHERE id = ?", [productId]);
      });

      Alert.alert(
        "Félicitations ! 🎉",
        `Vous avez sauvé ${product.nom_produit}.\n+${product.poids_kg}kg et +${product.prix_achat.toFixed(2)}€ sur votre profil.`,
      );

      router.replace("/fridge");
    } catch (error) {
      console.error("Erreur lors de la transaction :", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de la mise à jour de vos statistiques.");
    }
  };

  const handleUpdatePrice = async () => {
    if (!price) {
      Alert.alert("NOOOON ! 🥲", `Le prix n'a pas été ajouté.`);
      return;
    }

    const priceValue = parseFloat(price.replace(",", "."));
    if (Number.isNaN(priceValue)) {
      Alert.alert("Erreur", "Veuillez saisir un prix valide.");
      return;
    }

    try {
      await db.withTransactionAsync(async () => {
        await db.runAsync(
          `UPDATE produits
           SET prix_achat = COALESCE(prix_achat, 0) + ?
           WHERE id = ?`,
          [priceValue, productId],
        );
      });

      Alert.alert("Bravo ! 🎉", `Le prix a bien été ajouté.`, [
        {
          text: "OK",
          onPress: () => {
            if (productId) {
              setPrice("");
              router.replace(`/product?id=${productId}`);
            }
          },
        },
      ]);
    } catch (error) {
      console.error("Erreur lors de la transaction :", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de la mise à jour du prix.");
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#1B5E20" />;
  if (!product) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/")} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#1B5E20" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails du produit</Text>
        <View style={{ width: 45 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
      >
        {/* Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ 
              uri: product.image_url && product.image_url.trim() !== "" 
                ? product.image_url 
                : product.image_path 
            }}
            style={styles.productImage}
            resizeMode="contain"
          />
        </View>

        {/* Infos principales */}
        <View style={styles.infoCard}>
          <Text style={styles.brandText}>{product.marque}</Text>
          <Text style={styles.productName}>{product.nom_produit}</Text>
          <View style={styles.badgeContainer}>
            <View style={styles.quantityBadge}>
              <Text style={styles.quantityText}>{product.quantite_brute}</Text>
            </View>
            <View style={[styles.quantityBadge, { backgroundColor: "#E3F2FD" }]}>
              <Text style={[styles.quantityText, { color: "#2196F3" }]}>
                {product.poids_kg.toFixed(3)} kg
              </Text>
            </View>
          </View>
        </View>

        {/* Détails financiers et dates */}
        <View style={styles.detailsGrid}>
          {Number(stats_price_enabled) === 1 ? (
            product.prix_achat ? (
              <View style={styles.detailBox}>
                <Text style={styles.detailLabel}>Prix payé</Text>
                <Text style={styles.detailValue}>{product.prix_achat.toFixed(2)} €</Text>
              </View>
            ) : (
              <View style={styles.detailBox}>
                <Text style={styles.detailLabel}>Prix payé</Text>
                <View style={styles.inputArea}>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Ex: 2.50"
                    keyboardType="numeric"
                    value={price}
                    onChangeText={setPrice}
                    onBlur={handleUpdatePrice}
                  ></TextInput>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "flex-end",
                    }}
                  >
                    <Text style={{ marginRight: 8 }}>€</Text>
                    <Feather name="tag" size={20} color="#2E7D32" />
                  </View>
                </View>
              </View>
            )
          ) : null}

          <View style={styles.detailBox}>
            <Text style={styles.detailLabel}>Ajouté le</Text>
            <Text style={styles.detailValue}>
              {new Date(product.date_ajout).toLocaleDateString("fr-FR")}
            </Text>
          </View>
        </View>

        {/* SECTION DATE MODIFIABLE (MISE À JOUR) */}
        <TouchableOpacity
          style={styles.expirySection}
          onPress={() => setShowDatePicker(!showDatePicker)}
        >
          <Feather name="clock" size={20} color="#D32F2F" />
          <Text style={styles.expiryLabel}>Date limite : </Text>
          <Text style={styles.expiryDate}>
            {new Date(product.date_peremption).toLocaleDateString("fr-FR")}
          </Text>
          <Feather name="edit-2" size={14} color="#D32F2F" style={{ marginLeft: 10 }} />
        </TouchableOpacity>

        {/* PICKER IOS INLINE */}
        {showDatePicker && Platform.OS === "ios" && (
          <View style={styles.iosPickerContainer}>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              onChange={onDateChange}
              textColor="black"
              style={styles.pickerStyle}
            />
            <TouchableOpacity
              style={styles.confirmInlineBtn}
              onPress={() => confirmDateUpdate(tempDate)}
            >
              <Text style={styles.confirmInlineBtnText}>Enregistrer la nouvelle date</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* PICKER ANDROID */}
        {showDatePicker && Platform.OS === "android" && (
          <DateTimePicker value={tempDate} mode="date" display="default" onChange={onDateChange} />
        )}

        <Text style={styles.infoText}>
          En consommant ce produit avant sa péremption, vous évitez le gaspillage et augmentez votre
          impact écologique !
        </Text>
      </ScrollView>

      {/* Footer avec action */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity style={styles.consumeButton} onPress={handleConsume}>
          <Feather name="check-circle" size={22} color="white" style={{ marginRight: 10 }} />
          <Text style={styles.consumeButtonText}>J'ai consommé ce produit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.wastedButton} onPress={handleWasted}>
          <Feather name="check-circle" size={22} color="white" style={{ marginRight: 10 }} />
          <Text style={styles.wastedButtonText}>Je n'ai pas consommé ce produit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

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
  backButton: { backgroundColor: "#F5F5F5", padding: 8, borderRadius: 12 },
  scrollContent: { paddingHorizontal: 25, paddingBottom: 120 },
  imageContainer: {
    backgroundColor: "#F9F9F9",
    borderRadius: 30,
    height: 250,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
  },
  productImage: { width: "80%", height: "80%" },
  infoCard: { marginBottom: 25 },
  brandText: { fontSize: 14, fontWeight: "700", color: "#2E7D32", textTransform: "uppercase" },
  productName: { fontSize: 26, fontWeight: "800", color: "#333", marginTop: 5 },
  badgeContainer: { flexDirection: "row", marginTop: 10, gap: 10 },
  quantityBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  quantityText: { color: "#2E7D32", fontWeight: "700", fontSize: 13 },
  detailsGrid: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  detailBox: { backgroundColor: "#F8F9FA", padding: 15, borderRadius: 18, width: "48%" },
  detailLabel: { fontSize: 12, color: "#999", marginBottom: 5 },
  detailValue: { fontSize: 16, fontWeight: "700", color: "#333" },
  expirySection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    padding: 15,
    borderRadius: 18,
  },
  expiryLabel: { marginLeft: 10, fontSize: 16, color: "#333" },
  expiryDate: { fontSize: 16, fontWeight: "800", color: "#C62828" },
  infoText: {
    marginTop: 20,
    textAlign: "center",
    color: "#999",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 50,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    paddingHorizontal: 25,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  consumeButton: {
    backgroundColor: "#1B5E20",
    flexDirection: "row",
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  consumeButtonText: { color: "white", fontWeight: "800", fontSize: 16 },

  wastedButton: {
    marginTop: 10,
    backgroundColor: "#C62828",
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  wastedButtonText: { color: "white", fontWeight: "800", fontSize: 16 },

  // STYLES DU PICKER (AJOUTÉS)
  iosPickerContainer: {
    backgroundColor: "#F9F9F9",
    borderRadius: 20,
    marginTop: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: "#EEE",
    alignItems: "center",
    justifyContent: "center",
  },
  pickerStyle: {
    height: 150,
    width: "100%",
  },
  confirmInlineBtn: {
    backgroundColor: "#2E7D32",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 12,
    marginTop: 5,
    alignSelf: "center",
  },
  confirmInlineBtnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },

  priceInput: { flex: 1, padding: 15, fontSize: 16, fontWeight: "600" },

  inputArea: { flex: 1, flexDirection: "row" },
});
