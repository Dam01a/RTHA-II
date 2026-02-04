import { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import {
  HeartPulse,
  Activity,
  Droplets,
  Scale,
  Thermometer,
  Plus,
  TrendingUp,
  TrendingDown,
} from "lucide-react-native";
import { LineChart } from "react-native-gifted-charts";
import { mockHealthMetrics } from "@/src/data/mockData";
import { colors } from "@/src/theme/colors";

const metricConfig: Record<
  string,
  {
    icon: React.ElementType;
    label: string;
    color: string;
    bgClass: string;
    textClass: string;
    unit: string;
  }
> = {
  blood_pressure: {
    icon: HeartPulse,
    label: "Blood Pressure",
    color: colors.destructive,
    bgClass: "destructive",
    textClass: "destructive",
    unit: "mmHg",
  },
  heart_rate: {
    icon: Activity,
    label: "Heart Rate",
    color: colors.primary,
    bgClass: "primary",
    textClass: "primary",
    unit: "bpm",
  },
  blood_sugar: {
    icon: Droplets,
    label: "Blood Sugar",
    color: colors.info,
    bgClass: "info",
    textClass: "info",
    unit: "mg/dL",
  },
  weight: {
    icon: Scale,
    label: "Weight",
    color: colors.success,
    bgClass: "success",
    textClass: "success",
    unit: "lbs",
  },
  temperature: {
    icon: Thermometer,
    label: "Temperature",
    color: colors.warning,
    bgClass: "warning",
    textClass: "warning",
    unit: "°F",
  },
};

type MetricType = keyof typeof metricConfig;

const colorMap: Record<string, string> = {
  destructive: colors.destructive,
  primary: colors.primary,
  info: colors.info,
  success: colors.success,
  warning: colors.warning,
};

export default function HealthScreen() {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("blood_pressure");

  const getChartData = (type: MetricType) => {
    return mockHealthMetrics
      .filter((m) => m.type === type)
      .map((m) => {
        const val =
          type === "blood_pressure"
            ? parseInt(m.value.split("/")[0])
            : parseFloat(m.value);
        return {
          value: val,
          label: m.date.split("-").slice(1).join("/"),
          dataPointText: m.value,
        };
      })
      .reverse();
  };

  const chartData = getChartData(selectedMetric);
  const config = metricConfig[selectedMetric];
  const color = colorMap[config.bgClass] || colors.primary;

  const getLatestMetric = (type: MetricType) => {
    return mockHealthMetrics.find((m) => m.type === type);
  };

  const getTrend = (type: MetricType) => {
    const metrics = mockHealthMetrics.filter((m) => m.type === type);
    if (metrics.length < 2) return "stable";
    const current = parseFloat(metrics[0].value.split("/")[0]);
    const previous = parseFloat(metrics[1].value.split("/")[0]);
    if (current > previous) return "up";
    if (current < previous) return "down";
    return "stable";
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Health Tracking</Text>
          <Text style={styles.subtitle}>Monitor your vital signs and health metrics</Text>
        </View>
        <Pressable style={styles.addButton}>
          <Plus color="#fff" size={20} />
          <Text style={styles.addButtonText}>Log Reading</Text>
        </Pressable>
      </View>

      <View style={styles.metricGrid}>
        {(Object.keys(metricConfig) as MetricType[]).map((type) => {
          const cfg = metricConfig[type];
          const latest = getLatestMetric(type);
          const trend = getTrend(type);
          const isSelected = selectedMetric === type;
          const Icon = cfg.icon;

          return (
            <Pressable
              key={type}
              onPress={() => setSelectedMetric(type)}
              style={[
                styles.metricCard,
                isSelected && styles.metricCardSelected,
              ]}
            >
              <View style={styles.metricCardHeader}>
                <View
                  style={[
                    styles.metricIconBox,
                    { backgroundColor: isSelected ? "rgba(255,255,255,0.2)" : colorMap[cfg.bgClass] + "20" },
                  ]}
                >
                  <Icon
                    color={isSelected ? "#fff" : colorMap[cfg.textClass]}
                    size={20}
                  />
                </View>
                {trend !== "stable" && (
                  <View
                    style={[
                      styles.trendBox,
                      {
                        backgroundColor:
                          isSelected
                            ? "rgba(255,255,255,0.2)"
                            : trend === "up"
                            ? colors.destructive + "20"
                            : colors.success + "20",
                      },
                    ]}
                  >
                    {trend === "up" ? (
                      <TrendingUp
                        color={isSelected ? "#fff" : colors.destructive}
                        size={12}
                      />
                    ) : (
                      <TrendingDown
                        color={isSelected ? "#fff" : colors.success}
                        size={12}
                      />
                    )}
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.metricLabel,
                  isSelected && styles.textWhite80,
                ]}
              >
                {cfg.label}
              </Text>
              {latest ? (
                <Text style={[styles.metricValue, isSelected && styles.textWhite]}>
                  {latest.value}
                  <Text style={[styles.metricUnit, isSelected && styles.textWhite70]}>
                    {" "}
                    {cfg.unit}
                  </Text>
                </Text>
              ) : (
                <Text
                  style={[
                    styles.metricEmpty,
                    isSelected && styles.textWhite70,
                  ]}
                >
                  No data
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View style={[styles.chartIconBox, { backgroundColor: color + "20" }]}>
            <config.icon color={color} size={20} />
          </View>
          <View>
            <Text style={styles.chartTitle}>{config.label} Trends</Text>
            <Text style={styles.chartSubtitle}>Last 7 readings</Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          {chartData.length > 0 ? (
            <LineChart
              data={chartData}
              width={280}
              height={180}
              color={color}
              thickness={2}
              hideDataPoints={false}
              dataPointsColor={color}
              dataPointsRadius={4}
              textColor1={colors.mutedForeground}
              hideRules={true}
              yAxisColor="transparent"
              xAxisColor={colors.border}
              noOfSections={4}
              yAxisLabelWidth={0}
            />
          ) : (
            <View style={styles.chartEmpty}>
              <Text style={styles.chartEmptyText}>No data available for this metric</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.recentCard}>
        <Text style={styles.recentTitle}>Recent Readings</Text>
        <View style={styles.recentList}>
          {mockHealthMetrics.slice(0, 8).map((metric) => {
            const cfg = metricConfig[metric.type as MetricType];
            const Icon = cfg.icon;
            return (
              <View key={metric.id} style={styles.recentItem}>
                <View style={styles.recentItemLeft}>
                  <View
                    style={[
                      styles.recentIconBox,
                      { backgroundColor: colorMap[cfg.bgClass] + "20" },
                    ]}
                  >
                    <Icon color={colorMap[cfg.textClass]} size={20} />
                  </View>
                  <View>
                    <Text style={styles.recentMetricLabel}>{cfg.label}</Text>
                    <Text style={styles.recentMetricDate}>
                      {metric.date} at {metric.time}
                    </Text>
                  </View>
                </View>
                <View>
                  <Text style={styles.recentValue}>
                    {metric.value}
                    <Text style={styles.recentUnit}> {cfg.unit}</Text>
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: "700", color: colors.foreground },
  subtitle: { fontSize: 14, color: colors.mutedForeground, marginTop: 4 },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 16,
    alignSelf: "flex-start",
  },
  addButtonText: { fontSize: 16, fontWeight: "600", color: "#fff" },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    minWidth: "45%",
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.card,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 2,
  },
  metricCardSelected: {
    backgroundColor: colors.primary,
  },
  metricCardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  metricIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  trendBox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.mutedForeground,
    marginBottom: 4,
  },
  metricValue: { fontSize: 20, fontWeight: "700", color: colors.foreground },
  metricUnit: { fontSize: 12, fontWeight: "400", color: colors.mutedForeground },
  metricEmpty: { fontSize: 14, color: colors.mutedForeground },
  textWhite: { color: "#fff" },
  textWhite80: { color: "rgba(255,255,255,0.8)" },
  textWhite70: { color: "rgba(255,255,255,0.7)" },
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 2,
  },
  chartHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  chartIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  chartTitle: { fontSize: 16, fontWeight: "600", color: colors.foreground },
  chartSubtitle: { fontSize: 14, color: colors.mutedForeground, marginTop: 2 },
  chartContainer: { height: 200, alignItems: "center" },
  chartEmpty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  chartEmptyText: { fontSize: 14, color: colors.mutedForeground },
  recentCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 2,
  },
  recentTitle: { fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 16 },
  recentList: { gap: 12 },
  recentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  recentItemLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  recentIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  recentMetricLabel: { fontSize: 16, fontWeight: "500", color: colors.foreground },
  recentMetricDate: { fontSize: 14, color: colors.mutedForeground, marginTop: 2 },
  recentValue: { fontSize: 18, fontWeight: "700", color: colors.foreground },
  recentUnit: { fontSize: 14, fontWeight: "400", color: colors.mutedForeground },
});
