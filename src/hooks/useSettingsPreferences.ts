import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "@rtha/settings_preferences";

export type SettingsPreferences = {
  medicationReminders: boolean;
  appointmentReminders: boolean;
  refillAlerts: boolean;
  emergencyAlerts: boolean;
  largeText: boolean;
  highContrast: boolean;
};

const defaultPreferences: SettingsPreferences = {
  medicationReminders: true,
  appointmentReminders: true,
  refillAlerts: true,
  emergencyAlerts: true,
  largeText: false,
  highContrast: false,
};

function mergeWithDefaults(raw: unknown): SettingsPreferences {
  if (!raw || typeof raw !== "object") {
    return { ...defaultPreferences };
  }
  const o = raw as Record<string, unknown>;
  return {
    medicationReminders:
      typeof o.medicationReminders === "boolean" ? o.medicationReminders : defaultPreferences.medicationReminders,
    appointmentReminders:
      typeof o.appointmentReminders === "boolean" ? o.appointmentReminders : defaultPreferences.appointmentReminders,
    refillAlerts: typeof o.refillAlerts === "boolean" ? o.refillAlerts : defaultPreferences.refillAlerts,
    emergencyAlerts: typeof o.emergencyAlerts === "boolean" ? o.emergencyAlerts : defaultPreferences.emergencyAlerts,
    largeText: typeof o.largeText === "boolean" ? o.largeText : defaultPreferences.largeText,
    highContrast: typeof o.highContrast === "boolean" ? o.highContrast : defaultPreferences.highContrast,
  };
}

export function useSettingsPreferences() {
  const [preferences, setPreferencesState] = useState<SettingsPreferences>(defaultPreferences);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled) {
          return;
        }
        if (raw) {
          const parsed = JSON.parse(raw) as unknown;
          setPreferencesState(mergeWithDefaults(parsed));
        }
      } catch {
        // keep defaults
      } finally {
        if (!cancelled) {
          setIsHydrated(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setPreference = useCallback(<K extends keyof SettingsPreferences>(key: K, value: SettingsPreferences[K]) => {
    setPreferencesState((prev) => {
      const next = { ...prev, [key]: value };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {
        // non-fatal
      });
      return next;
    });
  }, []);

  return { preferences, setPreference, isHydrated };
}
