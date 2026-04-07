import { Stack } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "@/src/context/AuthContext";
import { colors } from "@/src/theme/colors";

function AppNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const { user, initializing, emailVerified } = useAuth();

  useEffect(() => {
    if (initializing) {
      return;
    }

    const isInAuthGroup = segments[0] === "(auth)";
    const isConfirmEmailScreen = segments[1] === "confirm-email";

    if (!user && !isInAuthGroup) {
      router.replace("/(auth)/login");
      return;
    }

    if (user && !emailVerified && !isConfirmEmailScreen) {
      router.replace("/(auth)/confirm-email");
      return;
    }

    if (user && emailVerified && isInAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [emailVerified, initializing, router, segments, user]);

  if (initializing) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
