import db from "@/app/database/database";
import * as Notifications from "expo-notifications";

export const scheduleExpiryNotification = async (productName, expiryDateStr) => {
  try {
    // Récupère tes réglages utilisateur
    const userSettings = await db.getFirstAsync(
      "SELECT notifications_enabled, alerte_delai_jours FROM utilisateur WHERE id = 1",
    );

    if (!userSettings || userSettings.notifications_enabled === 0) return null;

    const daysBefore = userSettings.alerte_delai_jours; // 1, 2, 3 ou 5
    const expiryDate = new Date(expiryDateStr);
    const triggerDate = new Date(expiryDate);

    triggerDate.setDate(triggerDate.getDate() - daysBefore);
    triggerDate.setHours(9, 0, 0); // Envoi à 9h le jour choisi

    if (triggerDate <= new Date()) return null;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Péremption proche ! ⚠️",
        body: `Ton produit "${productName}" périme dans ${daysBefore} jour(s).`,
        sound: true,
      },
      trigger: triggerDate,
    });

    return notificationId;
  } catch (e) {
    console.error(e);
    return null;
  }
};
