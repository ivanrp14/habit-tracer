import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import HabitList from "../components/HabitList";
import { Period, useHabits } from "../context/HabitsContext";

export default function HomeScreen() {
  const { getHabitsByPeriod, updateHabitProgress } = useHabits();
  const [period, setPeriod] = useState<Period>("Diario");
  const [showRewardId, setShowRewardId] = useState<string | null>(null);
  const [habits, setHabits] = useState(getHabitsByPeriod(period));

  // Actualizar hábitos cuando cambie el período
  useEffect(() => {
    setHabits(getHabitsByPeriod(period));
  }, [period, getHabitsByPeriod]);

  const completeHabit = (id: string) => {
    const habit = habits.find((h) => h.id === id);
    if (!habit || habit.progress >= habit.goal) return;

    updateHabitProgress(id, 1);

    // Verificar si se completó
    if (habit.progress + 1 === habit.goal) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowRewardId(id);
      setTimeout(() => setShowRewardId(null), 2000);
    }

    // Actualizar lista local
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, progress: h.progress + 1 } : h))
    );
  };

  const habitToShow = showRewardId
    ? habits.find((h) => h.id === showRewardId)
    : null;
  const showConfetti = habitToShow && habitToShow.progress === habitToShow.goal;

  return (
    <View style={styles.container}>
      <Text style={styles.mainTitle}>🌱 Mis Hábitos</Text>

      {/* Selector de periodo */}
      <View style={styles.periodSelector}>
        {(["Diario", "Semanal", "Mensual"] as Period[]).map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => setPeriod(p)}
            style={[
              styles.periodButton,
              period === p ? styles.activeButton : {},
            ]}
          >
            <Text
              style={[styles.periodText, period === p ? styles.activeText : {}]}
            >
              {p}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <HabitList
        habits={habits}
        showRewardId={showRewardId}
        onComplete={completeHabit}
      />

      {/* Confeti */}
      {showConfetti && habitToShow && (
        <ConfettiCannon
          count={50}
          origin={{ x: 150, y: 0 }}
          fadeOut
          autoStart
          fallSpeed={3000}
          colors={habitToShow.confettiColor}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    alignItems: "center",
    paddingTop: 60,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#f8fafc",
    marginBottom: 20,
  },
  periodSelector: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  periodButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#1e293b",
    borderWidth: 2,
    borderColor: "#334155",
  },
  activeButton: {
    backgroundColor: "#38bdf8",
    borderColor: "#38bdf8",
  },
  periodText: {
    color: "#94a3b8",
    fontWeight: "600",
    fontSize: 14,
  },
  activeText: {
    color: "#0f172a",
  },
});
