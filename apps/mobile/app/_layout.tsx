import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "@/lib/auth-store";
import { ActivityIndicator, View } from "react-native";
import { theme } from "@/lib/theme";

export default function RootLayout() {
  const { initialized, init } = useAuthStore();

  useEffect(() => {
    init();
  }, [init]);

  if (!initialized) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.canvas }}>
        <ActivityIndicator size="large" color={theme.colors.ink} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
