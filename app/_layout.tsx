import { Stack } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "@/src/context/AuthContext";
import { ThemeProvider, useTheme } from "@/src/context/ThemeContext";
import { colors } from "@/src/theme/colors";
import "@/global.css";

function AppNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const { user, initializing, emailVerified } = useAuth();

  useEffect(() => {
    if (initializing) {
      return;
    }

    const isInAuthGroup = segments[0] === "(auth)";
    const isConfirmEmailScreen = segments.includes("confirm-email");

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

  const { isDark } = useTheme();

  if (initializing) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isDark ? "#020817" : colors.background,
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
      <ThemeProvider>
        <AuthProvider>
          <StatusBar style="auto" />
          <AppNavigator />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
