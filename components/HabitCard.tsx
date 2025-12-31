import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Habit, useHabits } from "../context/HabitsContext";
import ProgressBar from "./ProgressBar";

type Props = {
  habit: Habit;
  showReward: boolean;
  onComplete: (id: string) => void;
  onDecrement: (id: string) => void;
};

export default function HabitCard({
  habit,
  showReward,
  onComplete,
  onDecrement,
}: Props) {
  const { deleteHabit, resetHabitProgress } = useHabits();
  const [showMenu, setShowMenu] = useState(false);
  const isCompleted = habit.progress >= habit.goal;

  // Escalas independientes
  const completeScale = useRef(new Animated.Value(1)).current;
  const decrementScale = useRef(new Animated.Value(1)).current;

  // Opacidad de botones al completarse
  const completeOpacity = useRef(
    new Animated.Value(isCompleted ? 1 : 1)
  ).current;
  const decrementOpacity = useRef(
    new Animated.Value(!isCompleted && habit.progress > 0 ? 1 : 0)
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(completeOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(decrementOpacity, {
        toValue: !isCompleted && habit.progress > 0 ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isCompleted, habit.progress]);

  const bounce = (scaleRef: Animated.Value, strong = true) => {
    if (!strong) {
      Animated.sequence([
        Animated.timing(scaleRef, {
          toValue: 0.97,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(scaleRef, {
          toValue: 1,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.sequence([
        Animated.timing(scaleRef, {
          toValue: 0.9,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(scaleRef, {
          toValue: 1.1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleRef, {
          toValue: 1,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

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
        <Animated.View
          style={[
            styles.rewardContainer,
            { opacity: completeOpacity, transform: [{ scale: completeScale }] },
          ]}
        >
          <Text style={styles.reward}>✨ ¡Completado! ✨</Text>
        </Animated.View>
      )}

      {/* Botones horizontales */}
      <View style={styles.buttonRow}>
        {/* Botón Marcar / Completado */}
        <Animated.View
          style={{
            flex: 1,
            marginRight: 8,
            opacity: completeOpacity,
            transform: [{ scale: completeScale }],
          }}
        >
          <TouchableWithoutFeedback
            onPress={() => {
              if (!isCompleted) {
                bounce(completeScale);
                onComplete(habit.id);
              } else {
                bounce(completeScale, false);
              }
            }}
          >
            <Animated.View
              style={[
                styles.actionButton,
                isCompleted && styles.completedButton,
              ]}
            >
              <Text
                style={[
                  styles.actionButtonText,
                  isCompleted && styles.completedButtonText,
                ]}
              >
                {isCompleted ? "✓ Completado" : "✅ Marcar"}
              </Text>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>

        {/* Botón Disminuir */}
        {!isCompleted && habit.goal > 1 && habit.progress > 0 && (
          <Animated.View
            style={{
              flex: 1,
              marginLeft: 8,
              opacity: decrementOpacity,
              transform: [{ scale: decrementScale }],
            }}
          >
            <TouchableWithoutFeedback
              onPress={() => {
                bounce(decrementScale);
                onDecrement(habit.id);
              }}
            >
              <Animated.View style={styles.decrementButton}>
                <Text style={styles.actionButtonText}>➖ Disminuir</Text>
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        )}
      </View>

      {/* Modal de menú clásico */}
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
    width: "100%",
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
  menuButton: { position: "absolute", top: 12, right: 12, padding: 8 },
  menuIcon: { fontSize: 20, color: "#94a3b8", fontWeight: "bold" },
  title: { fontSize: 20, fontWeight: "600", color: "#f8fafc", marginRight: 30 },
  subtitle: { marginTop: 8, fontSize: 14, color: "#94a3b8" },
  rewardContainer: {
    marginTop: 12,
    backgroundColor: "#422006",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  reward: { fontSize: 16, color: "#facc15", fontWeight: "bold" },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#22c55e",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  decrementButton: {
    flex: 1,
    backgroundColor: "#ef4444",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  completedButton: { backgroundColor: "#334155" },
  actionButtonText: { color: "#f8fafc", fontWeight: "600", fontSize: 14 },
  completedButtonText: { color: "#94a3b8" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
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
  menuOption: { padding: 18, alignItems: "center" },
  menuOptionText: { fontSize: 16, color: "#f8fafc", fontWeight: "500" },
  deleteText: { color: "#ef4444" },
  menuDivider: { height: 1, backgroundColor: "#334155" },
});
