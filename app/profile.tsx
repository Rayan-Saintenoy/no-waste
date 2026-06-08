import { Feather } from "@expo/vector-icons";
import { Link } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import db from "./database/database";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  const [user, setUser] = useState({
    name: "",
    firstname: "",
    mail: "",
    poids_total_sauve_kg: 0,
    argent_total_sauve_eur: 0,
  });

  // États pour la Modal d'édition
  const [isModalVisible, setModalVisible] = useState(false);
  const [editName, setEditName] = useState("");
  const [editFirstname, setEditFirstname] = useState("");
  const [editMail, setEditMail] = useState("");

  const fetchStats = async () => {
    try {
      const result = await db.getFirstAsync(`SELECT * FROM utilisateur LIMIT 1`);
      if (result) {
        setUser(result);
        setEditName(result.name);
        setEditFirstname(result.firstname);
        setEditMail(result.mail);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des stats :", error);
    }
  };

  const handleUpdate = async () => {
    if (!editName || !editFirstname || !editMail) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    try {
      await db.runAsync(
        `UPDATE utilisateur SET name = ?, firstname = ?, mail = ? WHERE id = (SELECT id FROM utilisateur LIMIT 1)`,
        [editName, editFirstname, editMail],
      );

      setUser({ ...user, name: editName, firstname: editFirstname, mail: editMail });
      setModalVisible(false);
      Alert.alert("Succès", "Profil mis à jour !");
    } catch (error) {
      console.error("Erreur update:", error);
      Alert.alert("Erreur", "Impossible de mettre à jour");
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Link href="/" replace asChild>
          <TouchableOpacity style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#1B5E20" />
          </TouchableOpacity>
        </Link>
        <Text style={styles.headerTitle}>Mon Profil</Text>
        <TouchableOpacity style={styles.editButton} onPress={() => setModalVisible(true)}>
          <Feather name="edit-3" size={20} color="#1B5E20" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Infos Utilisateur */}
        <View style={styles.userSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {user.firstname?.[0]?.toUpperCase()}
                {user.name?.[0]?.toUpperCase()}
              </Text>
            </View>
            <View style={styles.badge}>
              <Feather name="shield" size={12} color="white" />
            </View>
          </View>
          <Text style={styles.userName}>
            {user.firstname} {user.name}
          </Text>
          <Text style={styles.userEmail}>{user.mail}</Text>
        </View>

        {/* Statistiques */}
        <Text style={styles.sectionTitle}>Mon Impact NoWaste</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: "#E8F5E9" }]}>
            <Feather name="save" size={24} color="#4CAF50" />
            <Text style={styles.statValue}>{user.poids_total_sauve_kg} kg</Text>
            <Text style={styles.statLabel}>Sauvés</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#FFF3E0" }]}>
            <Feather name="dollar-sign" size={24} color="#FF9800" />
            <Text style={styles.statValue}>{user.argent_total_sauve_eur} €</Text>
            <Text style={styles.statLabel}>Économisés</Text>
          </View>
        </View>

        {/* PARTIE PARAMÈTRES GARDÉE */}
        <Text style={styles.sectionTitle}>Paramètres</Text>
        <View style={styles.menuContainer}>
          <Link href="/settings/notification" replace asChild>
            <TouchableOpacity activeOpacity={0.7} style={styles.menuItem}>
              <View style={[styles.menuIconContainer, { backgroundColor: "#E3F2FD" }]}>
                <Feather name="bell" size={20} color="#2196F3" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Notifications</Text>
                <Text style={styles.menuSub}>Alertes de péremption</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#CCC" />
            </TouchableOpacity>
          </Link>
          <Link href="/settings/confidentialite" replace asChild>
            <TouchableOpacity activeOpacity={0.7} style={styles.menuItem}>
              <View style={[styles.menuIconContainer, { backgroundColor: "#E8F5E9" }]}>
                <Feather name="shield" size={20} color="#4CAF50" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Confidentialité</Text>
                <Text style={styles.menuSub}>Données et sécurité</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#CCC" />
            </TouchableOpacity>
          </Link>
          <Link href="/settings/aide" replace asChild>
            <TouchableOpacity activeOpacity={0.7} style={styles.menuItem}>
              <View style={[styles.menuIconContainer, { backgroundColor: "#F5F5F5" }]}>
                <Feather name="help-circle" size={20} color="#666" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Aide & Support</Text>
                <Text style={styles.menuSub}>FAQ et contact</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#CCC" />
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>

      {/* MODAL D'ÉDITION */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Modifier mon profil</Text>

            <Text style={styles.inputLabel}>Prénom</Text>
            <TextInput
              style={styles.input}
              value={editFirstname}
              onChangeText={setEditFirstname}
              placeholder="Prénom"
            />

            <Text style={styles.inputLabel}>Nom</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Nom"
            />

            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={editMail}
              onChangeText={setEditMail}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleUpdate}>
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const MenuItem = ({ icon, title, sub, color, iconCol }) => (
  <TouchableOpacity style={styles.menuItem}>
    <View style={[styles.menuIconContainer, { backgroundColor: color }]}>
      <Feather name={icon} size={20} color={iconCol} />
    </View>
    <View style={styles.menuTextContainer}>
      <Text style={styles.menuTitle}>{title}</Text>
      <Text style={styles.menuSub}>{sub}</Text>
    </View>
    <Feather name="chevron-right" size={20} color="#CCC" />
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
  editButton: { backgroundColor: "#E8F5E9", padding: 10, borderRadius: 12 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  userSection: { alignItems: "center", marginTop: 20, marginBottom: 30 },
  avatarContainer: { position: "relative", marginBottom: 15 },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#1B5E20",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "white", fontSize: 32, fontWeight: "bold" },
  badge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#4CAF50",
    padding: 6,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: "white",
  },
  userName: { fontSize: 22, fontWeight: "800", color: "#333" },
  userEmail: { fontSize: 14, color: "#888", marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#333", marginTop: 20, marginBottom: 15 },
  statsGrid: { flexDirection: "row", justifyContent: "space-between" },
  statCard: { width: "48%", padding: 20, borderRadius: 22, alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "800", color: "#333", marginTop: 8 },
  statLabel: { fontSize: 12, color: "#666", fontWeight: "600" },
  menuContainer: { marginTop: 10 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F8F8F8",
  },
  menuIconContainer: { padding: 10, borderRadius: 12, marginRight: 15 },
  menuTextContainer: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: "700", color: "#333" },
  menuSub: { fontSize: 12, color: "#999", marginTop: 2 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
  },
  modalContent: {
    backgroundColor: "white",
    /* borderTopLeftRadius: 30,
    borderTopRightRadius: 30,*/
    borderRadius: 30,
    padding: 25,
    paddingBottom: 40,
    margin: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  inputLabel: { fontSize: 14, fontWeight: "700", color: "#666", marginBottom: 5, marginTop: 10 },
  input: { backgroundColor: "#F5F5F5", padding: 15, borderRadius: 12, fontSize: 16, color: "#333" },
  modalButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 30 },
  button: { flex: 1, padding: 15, borderRadius: 15, alignItems: "center" },
  cancelButton: { backgroundColor: "#F5F5F5", marginRight: 10 },
  saveButton: { backgroundColor: "#1B5E20", marginLeft: 10 },
  cancelButtonText: { color: "#666", fontWeight: "700" },
  saveButtonText: { color: "white", fontWeight: "700" },
});
