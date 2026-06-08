import db from "@/app/database/database";
import { Feather } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Activation de l'animation Layout pour Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function AideScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [userEmail, setUserEmail] = useState("");

  // Récupérer l'email de l'utilisateur en BDD
  useEffect(() => {
    const fetchUserMail = async () => {
      try {
        const result = await db.getFirstAsync("SELECT mail FROM utilisateur LIMIT 1");
        if (result) setUserEmail(result.mail);
      } catch (error) {
        console.error("Erreur mail :", error);
      }
    };
    fetchUserMail();
  }, []);

  const handleEmail = () => {
    const supportEmail = "supportNoWaste@exemple.com";
    const subject = "Demande d'assistance - NoWaste";
    const body = `Bonjour l'équipe support,\n\n[Votre message ici]\n\n------------------\nEmail de l'utilisateur : ${userEmail}`;

    const url = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    Linking.openURL(url);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/profile")}>
          <Feather name="arrow-left" size={24} color="#1B5E20" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Aide & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Section Contact Rapide */}
        <View style={styles.supportCard}>
          <Text style={styles.supportTitle}>Comment pouvons-nous vous aider ?</Text>
          <Text style={styles.supportSub}>
            Notre équipe est là pour vous accompagner dans votre démarche anti-gaspi.
          </Text>

          <TouchableOpacity style={styles.contactButton} onPress={handleEmail}>
            <Feather name="mail" size={20} color="white" />
            <Text style={styles.contactButtonText}>Contacter le support</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Questions fréquentes</Text>

        <FAQItem
          question="Comment ajouter un produit ?"
          answer="Vous avez deux options : utilisez le bouton 'Scanner' sur l'écran d'accueil, ou rendez-vous dans votre 'Frigo' et appuyez sur le bouton '+' pour ouvrir le scanner directement."
        />
        <FAQItem
          question="Pourquoi je ne reçois pas d'alertes ?"
          answer="Vérifiez que les notifications sont activées dans l'onglet 'Notifications' de votre profil et que vous avez autorisé l'application dans les réglages de votre téléphone."
        />
        <FAQItem
          question="Mes données sont-elles sécurisées ?"
          answer={
            "Oui, NoWaste stocke toutes vos données localement sur votre téléphone.\nAucune donnée personnelle n'est envoyée sur un serveur externe."
          }
        />
        <FAQItem
          question="Comment supprimer un produit ?"
          answer="Dans votre frigo, cliquez sur le produit pour ouvrir sa fiche détaillée, puis appuyez sur l'icône de la corbeille en haut à droite."
        />
        <FAQItem
          question="Comment supprimer tout mon frigo ?"
          answer={
            "Si vous souhaitez repartir de zéro, rendez-vous dans la section 'Confidentialité' de votre profil. \nEn bas de page, vous trouverez une option pour effacer l'intégralité des données de votre frigo."
          }
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Version de l'application : 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

// Composant pour chaque ligne de la FAQ (avec un petit système d'accordéon)
const FAQItem = ({ question, answer }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <TouchableOpacity style={styles.faqItem} onPress={toggleExpand} activeOpacity={0.7}>
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{question}</Text>
        <Feather name={expanded ? "chevron-up" : "chevron-down"} size={20} color="#666" />
      </View>
      {expanded && <Text style={styles.faqAnswer}>{answer}</Text>}
    </TouchableOpacity>
  );
};

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
  content: { padding: 20 },
  supportCard: {
    backgroundColor: "#1B5E20",
    borderRadius: 25,
    padding: 25,
    alignItems: "center",
    marginBottom: 30,
  },
  supportTitle: { color: "white", fontSize: 18, fontWeight: "800", textAlign: "center" },
  supportSub: { color: "#A5D6A7", fontSize: 13, textAlign: "center", marginTop: 8, lineHeight: 18 },
  contactButton: {
    flexDirection: "row",
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 15,
    marginTop: 20,
    alignItems: "center",
  },
  contactButtonText: { color: "white", fontWeight: "700", marginLeft: 10 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#333", marginBottom: 15, marginTop: 10 },
  faqItem: {
    backgroundColor: "#F9F9F9",
    padding: 18,
    borderRadius: 15,
    marginBottom: 12,
  },
  faqHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  faqQuestion: { fontSize: 15, fontWeight: "700", color: "#333", flex: 1, marginRight: 10 },
  faqAnswer: { fontSize: 14, color: "#666", marginTop: 12, lineHeight: 20 },
  footer: { marginTop: 40, alignItems: "center", paddingBottom: 20 },
  footerText: { fontSize: 12, color: "#BBB", fontWeight: "600" },
});
