import db from "@/app/database/database";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ConfidentialiteScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Fonction pour réinitialiser les données (Optionnel mais courant ici)
  const handleResetData = () => {
    Alert.alert(
      "Réinitialiser les données",
      "Voulez-vous vraiment supprimer tous les produits de votre frigo ? Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await db.runAsync("DELETE FROM produits");
              Alert.alert("Succès", "Toutes vos données ont été effacées.");
            } catch (error) {
              console.error(error);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/profile")}>
          <Feather name="arrow-left" size={24} color="#1B5E20" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confidentialité</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoBox}>
          <Feather name="lock" size={40} color="#2E7D32" style={styles.icon} />
          <Text style={styles.mainTitle}>Vos données vous appartiennent</Text>
          <Text style={styles.description}>
            NoWaste fonctionne avec une base de données <Text style={styles.local}>locale</Text>.
            Cela signifie que vos informations ne quittent jamais votre téléphone.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stockage des données</Text>
          <Text style={styles.text}>
            Toutes les données relatives à vos produits, vos dates de péremption et vos statistiques
            d'économie sont stockées directement sur votre appareil via SQLite.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accès à l'appareil</Text>
          <View style={styles.row}>
            <Feather name="camera" size={20} color="#666" />
            <Text style={styles.rowText}>
              Caméra : Utilisée uniquement pour scanner les codes-barres.
            </Text>
          </View>
          <View style={styles.row}>
            <Feather name="image" size={20} color="#666" />
            <Text style={styles.rowText}>
              Galerie : Utilisée pour ajouter des photos à vos produits.
            </Text>
          </View>
        </View>

        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Zone de danger</Text>
          <TouchableOpacity style={styles.resetButton} onPress={handleResetData}>
            <Feather name="trash-2" size={20} color="#D32F2F" />
            <Text style={styles.resetButtonText}>Effacer toutes les données du frigo</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#333" },
  backButton: { backgroundColor: "#F5F5F5", padding: 10, borderRadius: 12 },
  content: { padding: 25 },
  infoBox: {
    backgroundColor: "#E8F5E9",
    padding: 25,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 30,
  },
  icon: { marginBottom: 15 },
  mainTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1B5E20",
    textAlign: "center",
    marginBottom: 10,
  },
  description: { fontSize: 14, color: "#2E7D32", textAlign: "center", lineHeight: 20 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#333", marginBottom: 10 },
  text: { fontSize: 14, color: "#666", lineHeight: 22 },
  row: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  rowText: { fontSize: 14, color: "#666", marginLeft: 10, flex: 1 },
  dangerZone: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
  },
  dangerTitle: { fontSize: 16, fontWeight: "700", color: "#D32F2F", marginBottom: 15 },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    padding: 15,
    borderRadius: 15,
  },
  resetButtonText: { color: "#D32F2F", fontWeight: "700", marginLeft: 10 },
  local: { fontWeight: "bold" },
});
