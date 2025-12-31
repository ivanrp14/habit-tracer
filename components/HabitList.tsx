import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { Habit } from "../context/HabitsContext";
import HabitCard from "./HabitCard";

type Props = {
  habits: Habit[];
  showRewardId: string | null;
  onComplete: (id: string) => void;
  onDecrement: (id: string) => void;
};

export default function HabitList({
  habits,
  showRewardId,
  onComplete,
  onDecrement,
}: Props) {
  if (habits.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🌟</Text>
        <Text style={styles.emptyTitle}>No hay hábitos</Text>
        <Text style={styles.emptyText}>
          Crea tu primer hábito en la pestaña "Crear"
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={{ width: "75%" }} // 🔥 CLAVE
      data={habits}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <HabitCard
          habit={item}
          onComplete={onComplete}
          onDecrement={onDecrement}
          showReward={showRewardId === item.id && item.progress === item.goal}
        />
      )}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    alignItems: "stretch",

    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#f8fafc",
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 24,
  },
});
