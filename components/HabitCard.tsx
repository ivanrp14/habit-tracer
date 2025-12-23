import React, { useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Habit, useHabits } from "../context/HabitsContext";
import ProgressBar from "./ProgressBar";

type Props = {
  habit: Habit;
  showReward: boolean;
  onComplete: (id: string) => void;
};

export default function HabitCard({ habit, showReward, onComplete }: Props) {
  const { deleteHabit, resetHabitProgress } = useHabits();
  const [showMenu, setShowMenu] = useState(false);
  const isCompleted = habit.progress >= habit.goal;

  const handleDelete = () => {
    Alert.alert(
      "Eliminar hábito",
      `¿Estás seguro de eliminar "${habit.title}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            deleteHabit(habit.id);
            setShowMenu(false);
          },
        },
      ]
    );
  };

  const handleReset = () => {
    Alert.alert(
      "Reiniciar progreso",
      `¿Reiniciar el progreso de "${habit.title}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Reiniciar",
          onPress: () => {
            resetHabitProgress(habit.id);
            setShowMenu(false);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      {/* Menú de opciones */}
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => setShowMenu(true)}
      >
        <Text style={styles.menuIcon}>⋮</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{habit.title}</Text>
      <Text style={styles.subtitle}>
        {habit.progress} / {habit.goal} {habit.unit}
      </Text>
      <ProgressBar progress={habit.progress / habit.goal} />

      {showReward && isCompleted && (
        <View style={styles.rewardContainer}>
          <Text style={styles.reward}>✨ ¡Completado! ✨</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.completeButton, isCompleted && styles.completedButton]}
        onPress={() => onComplete(habit.id)}
        disabled={isCompleted}
      >
        <Text
          style={[
            styles.completeButtonText,
            isCompleted && styles.completedButtonText,
          ]}
        >
          {isCompleted ? "✓ Completado" : "✅ Marcar"}
        </Text>
      </TouchableOpacity>

      {/* Modal de menú */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuModal}>
            <TouchableOpacity style={styles.menuOption} onPress={handleReset}>
              <Text style={styles.menuOptionText}>🔄 Reiniciar progreso</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuOption} onPress={handleDelete}>
              <Text style={[styles.menuOptionText, styles.deleteText]}>
                🗑️ Eliminar hábito
              </Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => setShowMenu(false)}
            >
              <Text style={styles.menuOptionText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#1e293b",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    position: "relative",
  },
  menuButton: {
    position: "absolute",
    top: 12,
    right: 12,
    padding: 8,
    zIndex: 10,
  },
  menuIcon: {
    fontSize: 20,
    color: "#94a3b8",
    fontWeight: "bold",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#f8fafc",
    marginRight: 30,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: "#94a3b8",
  },
  rewardContainer: {
    marginTop: 12,
    backgroundColor: "#422006",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  reward: {
    fontSize: 16,
    color: "#facc15",
    fontWeight: "bold",
  },
  completeButton: {
    marginTop: 14,
    alignSelf: "flex-start",
    backgroundColor: "#22c55e",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  completedButton: {
    backgroundColor: "#334155",
  },
  completeButtonText: {
    color: "#022c22",
    fontWeight: "600",
    fontSize: 14,
  },
  completedButtonText: {
    color: "#64748b",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuModal: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    width: "80%",
    maxWidth: 320,
    overflow: "hidden",
  },
  menuOption: {
    padding: 18,
    alignItems: "center",
  },
  menuOptionText: {
    fontSize: 16,
    color: "#f8fafc",
    fontWeight: "500",
  },
  deleteText: {
    color: "#ef4444",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#334155",
  },
});
