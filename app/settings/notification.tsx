import db from "@/app/database/database";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function NotificationSettings() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // États pour les réglages
  const [isEnabled, setIsEnabled] = useState(false);
  const [selectedDays, setSelectedDays] = useState(3);

  // Charger les préférences actuelles
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const result = await db.getFirstAsync(
          "SELECT notifications_enabled, alerte_delai_jours FROM utilisateur LIMIT 1",
        );
        if (result) {
          setIsEnabled(result.notifications_enabled === 1);
          setSelectedDays(result.alerte_delai_jours || 3);
        }
      } catch (error) {
        console.error("Erreur chargement réglages :", error);
      }
    };
    loadSettings();
  }, []);

  const saveSettings = async (enabled, days) => {
    try {
      await db.runAsync(
        "UPDATE utilisateur SET notifications_enabled = ?, alerte_delai_jours = ?",
        [enabled ? 1 : 0, days],
      );
    } catch (error) {
      Alert.alert("Erreur", "Impossible de sauvegarder vos préférences.");
    }
  };

  const toggleSwitch = () => {
    const newValue = !isEnabled;
    setIsEnabled(newValue);
    saveSettings(newValue, selectedDays);
  };

  const changeDays = (days) => {
    setSelectedDays(days);
    saveSettings(isEnabled, days);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header avec redirection REPLACE pour ne rien laisser en fond */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/profile")}>
          <Feather name="arrow-left" size={24} color="#1B5E20" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.illustrationCard}>
          <Feather name="bell" size={50} color="#2E7D32" />
          <Text style={styles.infoText}>
            Ne gâchez plus rien ! Nous vous prévenons avant que vos produits ne périment.
          </Text>
        </View>

        {/* Toggle principal */}
        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Activer les alertes</Text>
            <Text style={styles.settingSubLabel}>Recevoir une notification push</Text>
          </View>
          <Switch
            trackColor={{ false: "#D1D1D1", true: "#A5D6A7" }}
            thumbColor={isEnabled ? "#2E7D32" : "#F4F3F4"}
            onValueChange={toggleSwitch}
            value={isEnabled}
          />
        </View>

        {isEnabled && (
          <View style={styles.daysSection}>
            <Text style={styles.sectionTitle}>Quand vous prévenir ?</Text>
            <Text style={styles.settingSubLabel}>
              Choisir le nombre de jours avant la date de péremption :
            </Text>

            <View style={styles.daysGrid}>
              {[1, 2, 3, 5].map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayCard, selectedDays === day && styles.dayCardSelected]}
                  onPress={() => changeDays(day)}
                >
                  <Text style={[styles.dayText, selectedDays === day && styles.dayTextSelected]}>
                    {day}
                  </Text>
                  <Text style={[styles.dayLabel, selectedDays === day && styles.dayTextSelected]}>
                    Jour{day > 1 ? "s" : ""}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
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
  illustrationCard: {
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    padding: 30,
    borderRadius: 25,
    marginBottom: 30,
  },
  infoText: {
    textAlign: "center",
    marginTop: 15,
    fontSize: 14,
    color: "#2E7D32",
    lineHeight: 20,
    fontWeight: "500",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  settingLabel: { fontSize: 16, fontWeight: "700", color: "#333" },
  settingSubLabel: { fontSize: 13, color: "#888", marginTop: 2 },
  daysSection: { marginTop: 30 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#333", marginBottom: 10 },
  daysGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  dayCard: {
    width: "22%",
    aspectRatio: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  dayCardSelected: {
    backgroundColor: "#E8F5E9",
    borderColor: "#2E7D32",
  },
  dayText: { fontSize: 20, fontWeight: "800", color: "#333" },
  dayTextSelected: { color: "#2E7D32" },
  dayLabel: { fontSize: 10, fontWeight: "600", color: "#888" },
});
