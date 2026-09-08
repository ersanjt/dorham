import "react-native-gesture-handler";
import { useEffect, useState } from "react";
import { I18nManager, View } from "react-native";
import { ErrorBoundaryProps, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import {
  Vazirmatn_400Regular,
  Vazirmatn_500Medium,
  Vazirmatn_600SemiBold,
  Vazirmatn_700Bold,
} from "@expo-google-fonts/vazirmatn";
import { MarkaziText_600SemiBold } from "@expo-google-fonts/markazi-text";
import { Button, Screen } from "../components/ui";
import { hydrateSession } from "../lib/session";
import { color } from "../lib/theme";

try {
  I18nManager.allowRTL(true);
  if (!I18nManager.isRTL) I18nManager.forceRTL(true);
} catch {
  /* Expo extra.forcesRTL already locks native RTL */
}

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <Screen title="دورهم" subtitle="یک خطای پیش‌بینی‌نشده رخ داد. دادهٔ تو پاک نشده.">
      <Button label="تلاش دوباره" onPress={retry} />
    </Screen>
  );
}

export default function RootLayout() {
  const [sessionReady, setSessionReady] = useState(false);
  const [fontsLoaded] = useFonts({
    Vazirmatn: Vazirmatn_400Regular,
    VazirmatnMedium: Vazirmatn_500Medium,
    VazirmatnSemiBold: Vazirmatn_600SemiBold,
    VazirmatnBold: Vazirmatn_700Bold,
    MarkaziText: MarkaziText_600SemiBold,
  });

  useEffect(() => {
    hydrateSession().finally(() => setSessionReady(true));
  }, []);

  useEffect(() => {
    if (fontsLoaded && sessionReady) SplashScreen.hideAsync().catch(() => undefined);
  }, [fontsLoaded, sessionReady]);

  if (!fontsLoaded || !sessionReady) {
    return <View style={{ flex: 1, backgroundColor: color.paper }} />;
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          contentStyle: { backgroundColor: color.paper },
        }}
      />
    </>
  );
}
