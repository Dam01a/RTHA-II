import { HeartPulse, Pill, Calendar, Activity, Settings } from "lucide-react-native";
import { Tabs } from "expo-router";
import { useTheme } from "@/src/context/ThemeContext";

export default function TabLayout() {
  const { isDark } = useTheme();
  const palette = isDark
    ? {
        background: "#0a0a0a",
        border: "#2a2a2a",
        text: "#f3f4f6",
        active: "#2aa198",
        inactive: "#8a8a8a",
      }
    : {
        background: "#ffffff",
        border: "#e5e7eb",
        text: "#0f172a",
        active: "#0f766e",
        inactive: "#64748b",
      };

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: palette.background },
        headerTitleStyle: { fontWeight: "700", fontSize: 18, color: palette.text },
        headerShadowVisible: false,
        tabBarActiveTintColor: palette.active,
        tabBarInactiveTintColor: palette.inactive,
        tabBarStyle: { backgroundColor: palette.background, borderTopColor: palette.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "500" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "RTHA",
          tabBarLabel: "Dashboard",
          tabBarIcon: ({ color, size }) => <HeartPulse color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="medications"
        options={{
          title: "Medications",
          tabBarIcon: ({ color, size }) => <Pill color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: "Appointments",
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: "Health",
          tabBarIcon: ({ color, size }) => <Activity color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
