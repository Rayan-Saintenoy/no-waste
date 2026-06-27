import db from "@/app/database/database";
import { parseWeightToKg } from "@/app/utils/format";
import { scheduleExpiryNotification } from "@/app/utils/notification";
import { Feather } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
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
  barre_code: string;
  product_name_fr: string;
  brands: string;
  marque: string;
  image_front_url: string;
  image_url: string
  quantity: string;
  product_name: string;
  categories: string;
  categories_hierarchy: string[];
} 

export default function ScannedItemScreen() {
  const [stats_price_enabled, setStats_price_enabled] = useState();
  
  const fetchUser = async () => {
    try {
      const result = (await db.getFirstAsync(`SELECT stats_price_enabled FROM utilisateur LIMIT 1`));
      if (result) {
        setStats_price_enabled(result.stats_price_enabled);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des stats :", error);
    }
  };

  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const barcode = Array.isArray(params.barcode) ? params.barcode[0] : params.barcode;

  const [loading, setLoading] = useState(true);
  const [productData, setProductData] = useState<Product | null>(null);

  const [price, setPrice] = useState("");
  const [expiryDate, setExpiryDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!barcode) return;

      try {
        setLoading(true);

        const url = `https://world.openfoodfacts.org/api/v3/product/${encodeURIComponent(barcode)}.json?fields=product_name,image_url,image_front_url,brands,quantity,categories,categories_hierarchy,labels,product_name_fr`;

        const response = await fetch(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "User-Agent": "NoWaste - Android/iOS - Version 1.0",
          },
        });

        const contentType = response.headers.get("content-type");

        if (!response.ok) {
          throw new Error(`Erreur serveur: ${response.status}`);
        }

        if (!contentType || !contentType.includes("application/json")) {
          const textError = await response.text();
          console.error(
            "L'API n'a pas renvoyé de JSON. Contenu reçu :",
            textError.substring(0, 200),
          );
          throw new Error("Format de réponse invalide (HTML reçu)");
        }

        const json = await response.json();

        if (json.product && Object.keys(json.product).length > 0) {
          setProductData(json.product);
        } else {
          Alert.alert("Produit inconnu", "Ce code-barres n'est pas encore dans la base.");
          if (router.canGoBack()) router.back();
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Erreur Fetch:", errorMessage);
        Alert.alert("Erreur", errorMessage || "Impossible de contacter l'API");
      } finally {
        setLoading(false);
      }
    };

    if (barcode) fetchProduct();
    fetchUser();
  }, [barcode]);

  const onDateChange = (_event: DateTimePickerEvent, selectedDate: Date | undefined) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      if (selectedDate) setExpiryDate(selectedDate);
    } else {
      if (selectedDate) setExpiryDate(selectedDate);
    }
  };

  const handleSaveToFridge = async () => {
    if (productData) {
      try {
        const weightInKg = parseWeightToKg(productData.quantity);
        const formattedDate = expiryDate.toISOString().split("T")[0];

        const hierarchyString = productData.categories_hierarchy
          ? productData.categories_hierarchy.join(", ")
          : "";

        await db.runAsync(
          `INSERT INTO produits (
            code_barre, 
            nom_produit,
            marque, 
            image_url,
            quantite_brute,
            categories, 
            categories_hierarchy, 
            poids_kg, 
            prix_achat, 
            date_peremption, 
            statut
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            barcode,
            productData.product_name_fr || productData.product_name,
            productData.brands || "Inconnue",
            productData.image_front_url || productData.image_url,
            productData.quantity || "",
            productData.categories || "",
            hierarchyString,
            weightInKg,
            parseFloat(price.replace(",", ".")) || null,
            formattedDate,
            "dans_le_frigo",
          ],
        );

        Alert.alert("Succès", "Produit ajouté au frigo !");

        await scheduleExpiryNotification(productData.product_name_fr, formattedDate);

        router.replace("/");
      } catch (error) {
        console.error("Erreur insertion DB:", error);
        Alert.alert(
          "Erreur",
          "Impossible d'enregistrer le produit. Vérifiez que les colonnes existent en base.",
        );
      }
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#1B5E20" />
        <Text style={{ marginTop: 10 }}>Recherche du produit...</Text>
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
        <Text style={styles.headerTitle}>Produit trouvé</Text>
        <View style={{ width: 45 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: productData?.image_front_url || productData?.image_url }}
            style={styles.productImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.brandText}>{productData?.brands}</Text>
          <Text style={styles.productName}>
            {productData?.product_name_fr || productData?.product_name}
          </Text>
          <View style={styles.quantityBadge}>
            <Text style={styles.quantityText}>{productData?.quantity}</Text>
          </View>
        </View>
        
        {Number(stats_price_enabled) === 1 ? (
            <>
              {/* INPUT PRIX */}
              <Text style={styles.sectionTitle}>Prix d'achat (€) Optionnel</Text>
              <View style={styles.priceInputContainer}>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Ex: 2.50"
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                />
                <Feather name="tag" size={20} color="#2E7D32" style={{ marginRight: 15 }} />
              </View>
            </>
          ) : null
        }

        {/* Saisie Date de péremption */}
        <Text style={styles.sectionTitle}>Date de péremption</Text>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowDatePicker(!showDatePicker)}
        >
          <View style={styles.dateIconContainer}>
            <Feather name="calendar" size={20} color="#2E7D32" />
          </View>
          <Text style={styles.dateText}>{expiryDate.toLocaleDateString("fr-FR")}</Text>
        </TouchableOpacity>

        {/* PICKER IOS INLINE (Même design que Scan) */}
        {showDatePicker && Platform.OS === "ios" && (
          <View style={styles.iosPickerContainer}>
            <DateTimePicker
              value={expiryDate}
              mode="date"
              display="spinner"
              onChange={onDateChange}
              minimumDate={new Date()}
              textColor="black"
              style={styles.pickerStyle}
            />
            <TouchableOpacity
              style={styles.confirmInlineBtn}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.confirmInlineBtnText}>Confirmer la date</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* PICKER ANDROID NATIVE */}
        {showDatePicker && Platform.OS === "android" && (
          <DateTimePicker
            value={expiryDate}
            mode="date"
            display="default"
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}

        <Text style={styles.sectionTitle}>Catégories</Text>
        <Text style={styles.categoriesText}>{productData?.categories}</Text>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveToFridge}>
          <Text style={styles.saveButtonText}>Ajouter au frigo</Text>
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
  scrollContent: { paddingHorizontal: 25 },
  imageContainer: {
    backgroundColor: "#F9F9F9",
    borderRadius: 30,
    height: 220,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  productImage: { width: "80%", height: "80%" },
  infoCard: { marginBottom: 25 },
  brandText: { fontSize: 14, fontWeight: "700", color: "#2E7D32", textTransform: "uppercase" },
  productName: { fontSize: 24, fontWeight: "800", color: "#333", marginTop: 5 },
  quantityBadge: {
    backgroundColor: "#E8F5E9",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 10,
  },
  quantityText: { color: "#2E7D32", fontWeight: "700", fontSize: 13 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#333", marginBottom: 10, marginTop: 15 },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E8F5E9",
    borderRadius: 20,
    padding: 12,
  },
  dateIconContainer: { backgroundColor: "#E8F5E9", padding: 8, borderRadius: 12, marginRight: 15 },
  dateText: { flex: 1, fontSize: 16, fontWeight: "600", color: "#333" },
  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E8F5E9",
    borderRadius: 20,
    backgroundColor: "#FFF",
  },
  priceInput: { flex: 1, padding: 15, fontSize: 16, fontWeight: "600" },
  categoriesText: { fontSize: 14, color: "#888", lineHeight: 20 },
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
  saveButton: {
    backgroundColor: "#1B5E20",
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center",
  },
  saveButtonText: { color: "white", fontWeight: "800", fontSize: 17 },

  // NOUVEAUX STYLES HARMONISÉS
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
});
