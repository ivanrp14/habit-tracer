import React, { useEffect, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useHabits } from "../../context/HabitsContext";
import * as DB from "../../services/database";

const SCREEN_WIDTH = Dimensions.get("window").width;

type TimeRange = "7d" | "30d" | "90d" | "all";

export default function StatsScreen() {
  const { habits } = useHabits();
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [stats, setStats] = useState<any>({
    dailyStats: [],
    totalCompletions: 0,
    mostCompletedHabit: null,
  });

  useEffect(() => {
    loadStats();
  }, [timeRange, habits]);

  const loadStats = () => {
    const days =
      timeRange === "7d"
        ? 7
        : timeRange === "30d"
        ? 30
        : timeRange === "90d"
        ? 90
        : 365;

    const dailyStats = DB.getDailyStats(days);
    const totalCompletions = DB.getTotalCompletions();
    const mostCompletedHabit = DB.getMostCompletedHabit();

    setStats({
      dailyStats,
      totalCompletions,
      mostCompletedHabit,
    });
  };

  // Calcular métricas generales
  const totalHabits = habits.length;
  const completedToday = habits.filter((h) => h.progress >= h.goal).length;
  const completionRateToday =
    totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0;

  const avgCompletionRate =
    stats.dailyStats.length > 0
      ? stats.dailyStats.reduce(
          (acc: number, s: any) => acc + s.completionRate,
          0
        ) / stats.dailyStats.length
      : 0;

  // Calcular mejor racha
  const bestStreak = habits.reduce((max, habit) => {
    const streak = DB.getStreakForHabit(habit.id);
    return streak > max ? streak : max;
  }, 0);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.mainTitle}>📊 Estadísticas</Text>

      {/* Selector de rango de tiempo */}
      <View style={styles.timeRangeSelector}>
        {[
          { label: "7 días", value: "7d" as TimeRange },
          { label: "30 días", value: "30d" as TimeRange },
          { label: "90 días", value: "90d" as TimeRange },
          { label: "Todo", value: "all" as TimeRange },
        ].map((range) => (
          <TouchableOpacity
            key={range.value}
            onPress={() => setTimeRange(range.value)}
            style={[
              styles.timeRangeButton,
              timeRange === range.value && styles.activeTimeRange,
            ]}
          >
            <Text
              style={[
                styles.timeRangeText,
                timeRange === range.value && styles.activeTimeRangeText,
              ]}
            >
              {range.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tarjetas de métricas principales */}
      <View style={styles.metricsGrid}>
        <MetricCard
          icon="🎯"
          label="Total de hábitos"
          value={totalHabits}
          color="#38bdf8"
        />
        <MetricCard
          icon="✅"
          label="Completados hoy"
          value={completedToday}
          color="#22c55e"
        />
        <MetricCard
          icon="📈"
          label="Tasa promedio"
          value={`${avgCompletionRate.toFixed(0)}%`}
          color="#f59e0b"
        />
        <MetricCard
          icon="🔥"
          label="Mejor racha"
          value={`${bestStreak} días`}
          color="#ef4444"
        />
      </View>

      {/* Progreso de hoy */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progreso de Hoy</Text>
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressPercentage}>
              {completionRateToday.toFixed(0)}%
            </Text>
            <Text style={styles.progressSubtext}>
              {completedToday} de {totalHabits} completados
            </Text>
          </View>

          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${completionRateToday}%` },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Hábito más completado */}
      {stats.mostCompletedHabit && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Hábito Estrella</Text>
          <View style={styles.starHabitCard}>
            <Text style={styles.starHabitTitle}>
              {stats.mostCompletedHabit.title}
            </Text>
            <Text style={styles.starHabitCount}>
              {stats.mostCompletedHabit.completions} completaciones
            </Text>
          </View>
        </View>
      )}

      {/* Lista de hábitos con rachas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔥 Rachas Actuales</Text>
        {habits.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No hay hábitos aún. ¡Crea uno para empezar!
            </Text>
          </View>
        ) : (
          habits.map((habit) => {
            const streak = DB.getStreakForHabit(habit.id);
            const progress = (habit.progress / habit.goal) * 100;

            return (
              <View key={habit.id} style={styles.habitStreakCard}>
                <View style={styles.habitStreakHeader}>
                  <Text style={styles.habitStreakTitle}>{habit.title}</Text>
                  <View style={styles.streakBadge}>
                    <Text style={styles.streakText}>🔥 {streak}</Text>
                  </View>
                </View>

                <View style={styles.habitStreakProgress}>
                  <Text style={styles.habitStreakSubtext}>
                    {habit.progress}/{habit.goal} {habit.unit}
                  </Text>
                  <Text style={styles.habitStreakPercentage}>
                    {progress.toFixed(0)}%
                  </Text>
                </View>

                <View style={styles.miniProgressBar}>
                  <View
                    style={[styles.miniProgressFill, { width: `${progress}%` }]}
                  />
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Gráfico de actividad (versión simple con barras) */}
      {stats.dailyStats.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Actividad Reciente</Text>
          <View style={styles.activityChart}>
            {stats.dailyStats
              .slice(0, 14)
              .reverse()
              .map((stat: any, index: number) => {
                const height = (stat.completionRate / 100) * 120;
                const date = new Date(stat.date);
                const dayLabel = date.toLocaleDateString("es", {
                  weekday: "short",
                });

                return (
                  <View key={index} style={styles.barContainer}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: Math.max(height, 10),
                          backgroundColor: getBarColor(stat.completionRate),
                        },
                      ]}
                    />
                    <Text style={styles.barLabel}>{dayLabel}</Text>
                  </View>
                );
              })}
          </View>

          <View style={styles.chartLegend}>
            <LegendItem color="#ef4444" label="< 50%" />
            <LegendItem color="#f59e0b" label="50-80%" />
            <LegendItem color="#22c55e" label="> 80%" />
          </View>
        </View>
      )}

      {/* Estadísticas totales */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Resumen Total</Text>
        <View style={styles.summaryCard}>
          <SummaryRow
            label="Completaciones totales"
            value={stats.totalCompletions}
          />
          <SummaryRow
            label="Días registrados"
            value={stats.dailyStats.length}
          />
          <SummaryRow
            label="Promedio por día"
            value={
              stats.dailyStats.length > 0
                ? (stats.totalCompletions / stats.dailyStats.length).toFixed(1)
                : "0"
            }
          />
          <SummaryRow label="Hábitos activos" value={totalHabits} />
        </View>
      </View>

      <View style={styles.footer} />
    </ScrollView>
  );
}

// ==================== Componentes auxiliares ====================

function MetricCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <View style={[styles.metricCard, { borderLeftColor: color }]}>
      <Text style={styles.metricIcon}>{icon}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

// ==================== Utilidades ====================

function getBarColor(completionRate: number): string {
  if (completionRate >= 80) return "#22c55e";
  if (completionRate >= 50) return "#f59e0b";
  return "#ef4444";
}

// ==================== Estilos ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#f8fafc",
    textAlign: "center",
    marginTop: 60,
    marginBottom: 20,
  },
  timeRangeSelector: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  timeRangeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#1e293b",
    borderWidth: 2,
    borderColor: "#334155",
  },
  activeTimeRange: {
    backgroundColor: "#38bdf8",
    borderColor: "#38bdf8",
  },
  timeRangeText: {
    color: "#94a3b8",
    fontWeight: "600",
    fontSize: 12,
  },
  activeTimeRangeText: {
    color: "#0f172a",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - 56) / 2,
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderLeftWidth: 4,
  },
  metricIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#f8fafc",
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#cbd5e1",
    marginBottom: 12,
  },
  progressCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 20,
  },
  progressHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  progressPercentage: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#38bdf8",
  },
  progressSubtext: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 4,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: "#334155",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#38bdf8",
    borderRadius: 6,
  },
  starHabitCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#f59e0b",
  },
  starHabitTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f8fafc",
    marginBottom: 8,
  },
  starHabitCount: {
    fontSize: 16,
    color: "#f59e0b",
    fontWeight: "600",
  },
  habitStreakCard: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  habitStreakHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  habitStreakTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f8fafc",
    flex: 1,
  },
  streakBadge: {
    backgroundColor: "#422006",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  streakText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#facc15",
  },
  habitStreakProgress: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  habitStreakSubtext: {
    fontSize: 13,
    color: "#94a3b8",
  },
  habitStreakPercentage: {
    fontSize: 14,
    fontWeight: "600",
    color: "#38bdf8",
  },
  miniProgressBar: {
    height: 6,
    backgroundColor: "#334155",
    borderRadius: 3,
    overflow: "hidden",
  },
  miniProgressFill: {
    height: "100%",
    backgroundColor: "#38bdf8",
    borderRadius: 3,
  },
  activityChart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 16,
    height: 180,
    marginBottom: 12,
  },
  barContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  bar: {
    width: "70%",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 4,
  },
  chartLegend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: "#94a3b8",
  },
  summaryCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#94a3b8",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#f8fafc",
  },
  emptyCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    fontStyle: "italic",
  },
  footer: {
    height: 40,
  },
});
