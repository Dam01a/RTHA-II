import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Droplets,
  HeartPulse,
  Info,
  Plus,
  Scale,
  ShieldCheck,
  Thermometer,
} from "lucide-react-native";
import { BarChart } from "react-native-gifted-charts";
import { Text } from "@/components/ui/text";
import { colors } from "@/src/theme/colors";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/context/ThemeContext";
import { useHealthMetrics } from "@/src/hooks/useHealthMetrics";
import { HealthMetricFormModal } from "@/src/components/health/HealthMetricFormModal";
import type { HealthMetric, HealthMetricInput } from "@/src/types/health";

type MetricType = HealthMetric["type"];

// ─── Theme tokens ─────────────────────────────────────────────────────────────

function useTokens(isDark: boolean) {
  return useMemo(
    () => ({
      bg: isDark ? "#000000" : "#f2f2f7",
      card: isDark ? "#0d0d0d" : "#ffffff",
      cardAlt: isDark ? "#141414" : "#f0f0f5",
      text: isDark ? "#ededed" : "#0f172a",
      muted: isDark ? "#888888" : "#64748b",
      border: isDark ? "#1e1e1e" : "transparent",
      shadow: isDark ? "transparent" : "rgba(0,0,0,0.06)",
    }),
    [isDark]
  );
}

// ─── Metric config ─────────────────────────────────────────────────────────────

const METRIC_CONFIG: Record<
  MetricType,
  {
    icon: React.ElementType;
    label: string;
    iconColor: string;
    iconBg: string;
    unit: string;
    badge?: { text: string; bg: string; color: string; dot?: boolean };
  }
> = {
  heart_rate: {
    icon: HeartPulse,
    label: "Heart Rate",
    iconColor: colors.destructive,
    iconBg: colors.destructive + "18",
    unit: "BPM",
    badge: { text: "LIVE", bg: colors.destructive + "18", color: colors.destructive },
  },
  temperature: {
    icon: Thermometer,
    label: "Temperature",
    iconColor: colors.primary,
    iconBg: colors.primary + "18",
    unit: "°F",
  },
  weight: {
    icon: Scale,
    label: "Weight",
    iconColor: colors.success,
    iconBg: colors.success + "18",
    unit: "lbs",
    badge: { text: "−2 lbs/mo", bg: "transparent", color: colors.success },
  },
  blood_sugar: {
    icon: Droplets,
    label: "Blood Sugar",
    iconColor: colors.warning,
    iconBg: colors.warning + "18",
    unit: "mg/dL",
    badge: { text: "Normal", bg: colors.success + "20", color: colors.success, dot: true },
  },
  blood_pressure: {
    icon: Activity,
    label: "Blood Pressure",
    iconColor: colors.info,
    iconBg: colors.info + "18",
    unit: "mmHg",
  },
};

const METRIC_ROW: MetricType[] = ["heart_rate", "temperature", "weight", "blood_sugar"];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HealthScreen() {
  const [modalOpen, setModalOpen] = useState(false);
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { metrics, loading, addHealthMetric } = useHealthMetrics(user?.uid);
  const insets = useSafeAreaInsets();
  const t = useTokens(isDark);

  const { width } = Dimensions.get("window");
  const CARD_WIDTH = (width - 10) / 2; // full-width two-column grid with 10px gap

  const getLatest = (type: MetricType) => metrics.find((m) => m.type === type);

  const bpChartData = useMemo(() => {
    return metrics
      .filter((m) => m.type === "blood_pressure")
      .slice(0, 7)
      .reverse()
      .map((m) => ({
        value: m.systolic ?? 0,
        label: m.recordedAt
          ? new Date(m.recordedAt).toLocaleDateString("en-US", { weekday: "short" })
          : "",
        frontColor: colors.primary,
        stacks: [
          { value: m.diastolic ?? 0, color: colors.primary + "55" },
          { value: (m.systolic ?? 0) - (m.diastolic ?? 0), color: colors.primary },
        ],
      }));
  }, [metrics]);

  const latestBP = getLatest("blood_pressure");

  const handleSave = async (input: HealthMetricInput) => {
    await addHealthMetric(input);
    setModalOpen(false);
  };

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <ScrollView
        contentContainerStyle={[
          s.scroll,
          { paddingTop: insets.top, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View style={[s.hero, { backgroundColor: colors.primary }]}>
          <Text style={s.heroBadge}>DAILY SUMMARY</Text>
          <Text style={s.heroTitle}>Your vitals look{"\n"}steady today.</Text>
          <Text style={s.heroDesc}>
            All metrics are within your target clinical range. Heart rate recovery improved 4% this week.
          </Text>
          <View style={s.heroStatus}>
            <ShieldCheck size={18} color="#bbf7d0" />
            <View>
              <Text style={s.heroStatusTitle}>Clinically Stable</Text>
              <Text style={s.heroStatusSub}>Last sync: Just now</Text>
            </View>
          </View>
        </View>

        {/* ── Metric Grid ── */}
        {loading ? (
          <ActivityIndicator color={colors.primary} style={s.loader} />
        ) : (
          <View style={s.grid}>
            {METRIC_ROW.map((type) => {
              const cfg = METRIC_CONFIG[type];
              const latest = getLatest(type);
              const Icon = cfg.icon;

              return (
                <View
                  key={type}
                  style={[
                    s.metricCard,
                    { width: CARD_WIDTH, backgroundColor: t.card },
                  ]}
                >
                  <View style={s.metricCardTop}>
                    <View style={[s.metricIcon, { backgroundColor: cfg.iconBg }]}>
                      <Icon color={cfg.iconColor} size={18} />
                    </View>
                    {cfg.badge && (
                      <View style={[s.badge, { backgroundColor: cfg.badge.bg }]}>
                        {cfg.badge.dot && (
                          <View style={[s.badgeDot, { backgroundColor: cfg.badge.color }]} />
                        )}
                        <Text style={[s.badgeText, { color: cfg.badge.color }]}>
                          {cfg.badge.text}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={[s.metricLabel, { color: t.muted }]}>{cfg.label}</Text>

                  {latest ? (
                    <View style={s.metricValueRow}>
                      <Text style={[s.metricValue, { color: t.text }]}>{latest.value}</Text>
                      <Text style={[s.metricUnit, { color: t.muted }]}>{cfg.unit}</Text>
                    </View>
                  ) : (
                    <Text style={[s.metricEmpty, { color: t.muted }]}>—</Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* ── Blood Pressure Chart ── */}
        <View style={[s.section, { backgroundColor: t.card }]}>
          <View style={s.bpHeader}>
            <View style={s.bpHeaderLeft}>
              <Text style={[s.sectionTitle, { color: t.text }]}>Blood Pressure</Text>
              <Text style={[s.sectionSub, { color: t.muted }]}>Last 7 readings</Text>
            </View>
            {latestBP && (
              <View style={s.bpCurrent}>
                <Text style={[s.bpCurrentValue, { color: colors.primary }]}>
                  {latestBP.systolic}/{latestBP.diastolic}
                </Text>
                <Text style={[s.bpCurrentUnit, { color: t.muted }]}>mmHg</Text>
              </View>
            )}
          </View>

          <View style={[s.chartArea, { backgroundColor: t.cardAlt }]}>
            {bpChartData.length > 0 ? (
              <BarChart
                data={bpChartData}
                width={width - 32} // chartArea horizontal padding only
                height={130}
                barWidth={24}
                spacing={14}
                roundedTop
                roundedBottom
                hideRules
                xAxisThickness={0}
                yAxisThickness={0}
                yAxisTextStyle={{ color: "transparent" }}
                xAxisLabelTextStyle={{ color: t.muted, fontSize: 11 }}
                noOfSections={3}
                isAnimated
              />
            ) : (
              <Text style={[s.chartEmpty, { color: t.muted }]}>No data recorded yet.</Text>
            )}

            <View style={s.legend}>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: colors.primary + "55" }]} />
                <Text style={[s.legendText, { color: t.muted }]}>Diastolic</Text>
              </View>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: colors.primary }]} />
                <Text style={[s.legendText, { color: t.muted }]}>Systolic</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Weekly Insights ── */}
        <View style={[s.section, { backgroundColor: t.card }]}>
          <View style={s.insightHeader}>
            <Text style={[s.sectionTitle, { color: t.text }]}>Weekly Insights</Text>
            <Activity size={16} color={colors.primary} />
          </View>

          <InsightCard
            icon={<CheckCircle2 size={16} color={colors.success} />}
            iconBg={colors.success + "18"}
            title="Sleep Quality Impact"
            desc="Your heart rate is 5% lower on days you get 7+ hours of sleep."
            cardBg={t.cardAlt}
            textColor={t.text}
            mutedColor={t.muted}
          />
          <InsightCard
            icon={<Info size={16} color={colors.primary} />}
            iconBg={colors.primary + "18"}
            title="Consistency Streak"
            desc="You've recorded vitals for 12 consecutive days. Keep it up!"
            cardBg={t.cardAlt}
            textColor={t.text}
            mutedColor={t.muted}
          />
        </View>

        {/* ── Medical Profile ── */}
        <View style={[s.section, { backgroundColor: t.card }]}>
          <Text style={[s.sectionTitle, { color: t.text }]}>Medical Profile</Text>

          <View style={s.profileGrid}>
            <View style={[s.profileItem, { backgroundColor: t.cardAlt }]}>
              <Text style={[s.profileLabel, { color: t.muted }]}>BLOOD TYPE</Text>
              <Text style={[s.profileValue, { color: t.text }]}>O Positive</Text>
            </View>
            <View style={[s.profileItem, { backgroundColor: t.cardAlt }]}>
              <Text style={[s.profileLabel, { color: t.muted }]}>PRIMARY DOCTOR</Text>
              <Text style={[s.profileValue, { color: t.text }]}>Dr. Elena Ross</Text>
            </View>
          </View>

          <TouchableOpacity style={s.profileLink} activeOpacity={0.7}>
            <Text style={[s.profileLinkText, { color: colors.primary }]}>View Full Records</Text>
            <ArrowRight size={15} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── FAB ── */}
      <View style={[s.fabWrap, { bottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[s.fab, { backgroundColor: colors.primary }]}
          onPress={() => setModalOpen(true)}
          activeOpacity={0.85}
        >
          <Plus color="#fff" size={18} />
          <Text style={s.fabText}>Log Reading</Text>
        </TouchableOpacity>
      </View>

      <HealthMetricFormModal
        visible={modalOpen}
        initial={null}
        onClose={() => setModalOpen(false)}
        selectedType="blood_pressure"
        onSave={handleSave}
      />
    </View>
  );
}

// ─── Insight card sub-component ───────────────────────────────────────────────

function InsightCard({
  icon,
  iconBg,
  title,
  desc,
  cardBg,
  textColor,
  mutedColor,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  desc: string;
  cardBg: string;
  textColor: string;
  mutedColor: string;
}) {
  return (
    <View style={[s.insightCard, { backgroundColor: cardBg }]}>
      <View style={[s.insightIconWrap, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={s.insightText}>
        <Text style={[s.insightTitle, { color: textColor }]}>{title}</Text>
        <Text style={[s.insightDesc, { color: mutedColor }]}>{desc}</Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const PX = 0; // edge-to-edge page layout

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: PX, gap: 12 },
  loader: { marginVertical: 48 },

  // Hero
  hero: {
    borderRadius: 24,
    padding: 24,
  },
  heroBadge: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 34,
    marginBottom: 10,
  },
  heroDesc: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 20,
  },
  heroStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.14)",
    padding: 14,
    borderRadius: 14,
  },
  heroStatusTitle: { color: "#fff", fontSize: 14, fontWeight: "700" },
  heroStatusSub: { color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 2 },

  // Metric grid — two columns
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricCard: {
    borderRadius: 20,
    padding: 16,
    gap: 6,
    // shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  metricCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeDot: { width: 5, height: 5, borderRadius: 3 },
  badgeText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.4 },
  metricLabel: { fontSize: 12, fontWeight: "600" },
  metricValueRow: { flexDirection: "row", alignItems: "baseline", gap: 4, marginTop: 2 },
  metricValue: { fontSize: 32, fontWeight: "800", letterSpacing: -1 },
  metricUnit: { fontSize: 13, fontWeight: "600" },
  metricEmpty: { fontSize: 28, fontWeight: "300", marginTop: 2 },

  // Shared section card
  section: {
    borderRadius: 20,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700", letterSpacing: -0.2 },
  sectionSub: { fontSize: 12, marginTop: 2 },

  // Blood pressure
  bpHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  bpHeaderLeft: { gap: 2 },
  bpCurrent: { alignItems: "flex-end" },
  bpCurrentValue: { fontSize: 26, fontWeight: "800", letterSpacing: -1 },
  bpCurrentUnit: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  chartArea: {
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    paddingBottom: 12,
  },
  chartEmpty: { textAlign: "center", paddingVertical: 40, fontSize: 13 },
  legend: { flexDirection: "row", gap: 20, marginTop: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, fontWeight: "500" },

  // Insights
  insightHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  insightCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 14,
  },
  insightIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  insightText: { flex: 1, gap: 3 },
  insightTitle: { fontSize: 14, fontWeight: "700" },
  insightDesc: { fontSize: 13, lineHeight: 18 },

  // Medical profile
  profileGrid: { flexDirection: "row", gap: 10 },
  profileItem: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  profileLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.8 },
  profileValue: { fontSize: 15, fontWeight: "600" },
  profileLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  profileLinkText: { fontSize: 13, fontWeight: "700" },

  // FAB
  fabWrap: {
    position: "absolute",
    left: PX,
    right: PX,
    alignItems: "center",
  },
  fab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  fabText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});