import { initDatabase } from "@/app/database/database";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

// Configuration du comportement des notifications (quand l'app est ouverte)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // 1. Initialisation de la BDD
    try {
      initDatabase();
      console.log("Base de données initialisée !");
    } catch (e) {
      console.error("Erreur BDD", e);
    }

    // 2. Demande des permissions pour les notifications au premier lancement
    const requestPermissions = async () => {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        console.log("Permissions notifications refusées !");
      }
    };

    requestPermissions();
  }, []);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
        {/* On retire (tabs) car tu ne l'utilises plus */}
        <Stack.Screen name="index" />
        <Stack.Screen name="fridge" />
        <Stack.Screen name="scan" />
        <Stack.Screen name="product" options={{ presentation: "modal" }} />
        <Stack.Screen name="scannedItem" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
