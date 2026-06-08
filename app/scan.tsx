import db from "@/app/database/database";
import { scheduleExpiryNotification } from "@/app/utils/notification";
import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { Beef, Carrot, CupSoda, Milk } from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const router = useRouter();
  const isScanning = useRef(false);

  const [isModalVisible, setModalVisible] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualCode, setManualCode] = useState("");

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  const [form, setForm] = useState({
    nom: "",
    marque: "",
    quantite: "1",
    unite: "g",
    prix: "",
    categorie: "legumes",
    date: new Date().toISOString().split("T")[0],
  });

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View
        style={[styles.container, { justifyContent: "center", alignItems: "center", padding: 20 }]}
      >
        <Text style={{ color: "white", textAlign: "center", marginBottom: 20 }}>
          Autorisation caméra requise.
        </Text>
        <TouchableOpacity style={styles.manualButton} onPress={requestPermission}>
          <Text style={styles.manualButtonText}>Autoriser la caméra</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcodeScanned = ({ data }) => {
    if (isScanning.current) return;
    isScanning.current = true;
    setScanned(true);
    router.replace({ pathname: "/scannedItem", params: { barcode: data } });
    setTimeout(() => {
      isScanning.current = false;
      setScanned(false);
    }, 3000);
  };

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      if (event.type === "set" && selectedDate) {
        setForm({ ...form, date: selectedDate.toISOString().split("T")[0] });
        setTempDate(selectedDate);
      }
    } else if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const confirmIOSDate = () => {
    setForm({ ...form, date: tempDate.toISOString().split("T")[0] });
    setShowDatePicker(false);
  };

  const handleAddManual = async () => {
    if (!form.nom || !form.quantite) {
      Alert.alert("Erreur", "Le nom et la quantité sont obligatoires.");
      return;
    }

    // Calcul du poids réel en unité de base (kg ou L)
    let qte = parseFloat(form.quantite.replace(",", ".")) || 0;
    let poidsFinal = qte;

    // Conversion si nécessaire (ex: g -> kg)
    if (form.unite === "g" || form.unite === "ml") {
      poidsFinal = qte / 1000;
    }

    try {
      await db.runAsync(
        `INSERT INTO produits (
        nom_produit, marque, quantite_brute, poids_kg, prix_achat, categories_hierarchy, date_peremption, statut
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'dans_le_frigo')`,
        [
          form.nom,
          form.marque,
          form.quantite + form.unite,
          poidsFinal,
          parseFloat(form.prix.replace(",", ".")) || 0,
          form.categorie,
          form.date,
        ],
      );
      setModalVisible(false);

      await scheduleExpiryNotification(form.nom, form.date);

      router.replace("/");
    } catch (error) {
      console.error(error);
      Alert.alert("Erreur", "Impossible d'ajouter le produit.");
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      >
        <View style={styles.cameraOverlay}>
          <Feather
            name="maximize"
            size={250}
            color={scanned ? "#4CAF50" : "rgba(255,255,255,0.3)"}
          />
        </View>
      </CameraView>

      <View style={[styles.uiContainer, { top: insets.top + 20 }]}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.replace("/")}>
          <Feather name="x" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.handle} />
        <TouchableOpacity style={styles.manualButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.manualButtonText}>Saisir manuellement</Text>
        </TouchableOpacity>
      </View>

      <Modal animationType="slide" transparent={true} visible={isModalVisible}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter un produit</Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setShowDatePicker(false);
                }}
              >
                <Feather name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>
                  {isManualMode ? "Produit sans code" : "Recherche par code"}
                </Text>
                <Switch value={isManualMode} onValueChange={setIsManualMode} />
              </View>

              {!isManualMode ? (
                <View>
                  <Text style={styles.inputLabel}>Code-barres (EAN)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="301..."
                    value={manualCode}
                    onChangeText={setManualCode}
                  />
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={() =>
                      router.replace({ pathname: "/scannedItem", params: { barcode: manualCode } })
                    }
                  >
                    <Text style={styles.saveButtonText}>Rechercher le produit</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <Text style={styles.inputLabel}>Nom du produit *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="ex: Pommes de terre"
                    onChangeText={(t) => setForm({ ...form, nom: t })}
                  />

                  <Text style={styles.inputLabel}>Marque</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="ex: Danone"
                    onChangeText={(t) => setForm({ ...form, marque: t })}
                  />

                  <View style={styles.row}>
                    {/* Champ Quantité */}
                    <View style={{ width: "40%" }}>
                      <Text style={styles.inputLabel}>Quantité</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="ex: 500"
                        keyboardType="decimal-pad"
                        value={form.quantite}
                        onChangeText={(t) => setForm({ ...form, quantite: t })}
                      />
                    </View>

                    {/* Sélecteur d'Unité Segmenté */}
                    <View style={{ width: "56%" }}>
                      <Text style={styles.inputLabel}>Unité</Text>
                      <View style={styles.segmentedControl}>
                        {["g", "kg", "ml", "L"].map((u) => (
                          <TouchableOpacity
                            key={u}
                            activeOpacity={0.8}
                            style={[styles.segmentBtn, form.unite === u && styles.segmentBtnActive]}
                            onPress={() => setForm({ ...form, unite: u })}
                          >
                            <Text
                              style={[
                                styles.segmentText,
                                form.unite === u && styles.segmentTextActive,
                              ]}
                            >
                              {u}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>

                  <View style={styles.row}>
                    <View style={{ width: "100%" }}>
                      <Text style={styles.inputLabel}>Prix (€)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="0.00"
                        keyboardType="numeric"
                        onChangeText={(t) => setForm({ ...form, prix: t })}
                      />
                    </View>
                  </View>

                  <Text style={styles.inputLabel}>Catégorie</Text>
                  <View style={styles.catGrid}>
                    <CatBtn
                      label="Laitiers"
                      icon={Milk}
                      active={form.categorie === "laitiers"}
                      onPress={() => setForm({ ...form, categorie: "laitiers" })}
                      col="#2196F3"
                    />
                    <CatBtn
                      label="Légumes"
                      icon={Carrot}
                      active={form.categorie === "legumes"}
                      onPress={() => setForm({ ...form, categorie: "legumes" })}
                      col="#4CAF50"
                    />
                    <CatBtn
                      label="Viandes"
                      icon={Beef}
                      active={form.categorie === "viande"}
                      onPress={() => setForm({ ...form, categorie: "viande" })}
                      col="#F44336"
                    />
                    <CatBtn
                      label="Boissons"
                      icon={CupSoda}
                      active={form.categorie === "boissons"}
                      onPress={() => setForm({ ...form, categorie: "boissons" })}
                      col="#FF9800"
                    />
                  </View>

                  <Text style={styles.inputLabel}>Date de péremption</Text>
                  <TouchableOpacity
                    style={styles.datePickerToggle}
                    onPress={() => setShowDatePicker(!showDatePicker)}
                  >
                    <Feather name="calendar" size={18} color="#2E7D32" />
                    <Text style={styles.datePickerText}>{form.date}</Text>
                  </TouchableOpacity>

                  {showDatePicker && Platform.OS === "ios" && (
                    <View style={styles.iosPickerContainer}>
                      <DateTimePicker
                        value={tempDate}
                        mode="date"
                        display="spinner"
                        onChange={onDateChange}
                        minimumDate={new Date()}
                        textColor="black"
                        style={styles.pickerStyle}
                      />
                      <TouchableOpacity style={styles.confirmInlineBtn} onPress={confirmIOSDate}>
                        <Text style={styles.confirmInlineBtnText}>Confirmer la date</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <TouchableOpacity style={styles.saveButton} onPress={handleAddManual}>
                    <Text style={styles.saveButtonText}>Ajouter au frigo</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>

        {showDatePicker && Platform.OS === "android" && (
          <DateTimePicker
            value={tempDate}
            mode="date"
            display="default"
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}
      </Modal>
    </View>
  );
}

const CatBtn = ({ label, icon: Icon, active, onPress, col }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.catButton,
      active
        ? { backgroundColor: col + "15", borderColor: col }
        : { backgroundColor: "#F2F2F2", borderColor: "#D0D0D0" },
    ]}
  >
    <Icon size={18} color={active ? col : "#666"} />
    <Text style={[styles.catText, { color: active ? col : "#666" }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  cameraOverlay: { flex: 1, justifyContent: "center", alignItems: "center", paddingBottom: 100 },
  uiContainer: { position: "absolute", left: 20 },
  closeButton: { backgroundColor: "rgba(0,0,0,0.5)", padding: 10, borderRadius: 25 },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "white",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    alignItems: "center",
  },
  handle: { width: 40, height: 5, backgroundColor: "#EEE", borderRadius: 10, marginBottom: 20 },
  manualButton: {
    backgroundColor: "#E8F5E9",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 15,
  },
  manualButtonText: { color: "#2E7D32", fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 30,
    padding: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#333" },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    padding: 12,
    borderRadius: 15,
    marginBottom: 10,
  },
  switchLabel: { fontWeight: "700", color: "#444" },
  inputLabel: { fontSize: 13, fontWeight: "700", color: "#555", marginBottom: 5, marginTop: 12 },
  input: {
    backgroundColor: "#F9F9F9",
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    color: "#333",
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  catGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 5,
  },
  catButton: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
  },
  catText: { marginLeft: 8, fontWeight: "700", fontSize: 12 },
  datePickerToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F9F9",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  datePickerText: { marginLeft: 10, fontSize: 16, color: "#333", fontWeight: "600" },
  saveButton: {
    backgroundColor: "#1B5E20",
    padding: 16,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 20,
  },
  saveButtonText: { color: "white", fontWeight: "800", fontSize: 16 },
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
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "#F0F0F0", // Fond gris clair type iOS
    borderRadius: 12,
    padding: 4,
    height: 50,
    alignItems: "center",
  },
  segmentBtn: {
    flex: 1,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: "white", // La pilule blanche
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
  },
  segmentTextActive: {
    color: "#2E7D32", // Texte vert pour l'unité active
    fontWeight: "800",
  },
});
