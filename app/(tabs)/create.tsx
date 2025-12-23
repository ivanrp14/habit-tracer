import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Period, useHabits } from "../../context/HabitsContext";

const EMOJI_OPTIONS = [
  "📘",
  "🏃",
  "🍎",
  "💪",
  "🧘",
  "🎯",
  "✍️",
  "🎨",
  "🎵",
  "💻",
  "🌅",
  "🛌",
  "💧",
  "🧠",
  "❤️",
  "📚",
  "🎓",
  "🌱",
  "⚡",
  "🔥",
];

const COLOR_PRESETS = [
  ["#FFD700", "#FF5733", "#33FF57"],
  ["#38bdf8", "#22c55e", "#facc15"],
  ["#ff69b4", "#ff4500", "#8a2be2"],
  ["#00FFFF", "#FF00FF", "#FFFF00"],
  ["#FFA500", "#800080", "#008000"],
  ["#e74c3c", "#3498db", "#2ecc71"],
];

export default function CreateScreen() {
  const { addHabit } = useHabits();
  const [selectedEmoji, setSelectedEmoji] = useState("🎯");
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("1");
  const [unit, setUnit] = useState("vez");
  const [period, setPeriod] = useState<Period>("Diario");
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);

  const handleCreate = () => {
    if (!title.trim()) {
      Alert.alert("Error", "Por favor ingresa un nombre para el hábito");
      return;
    }

    const goalNumber = parseInt(goal);
    if (isNaN(goalNumber) || goalNumber < 1) {
      Alert.alert("Error", "La meta debe ser un número mayor a 0");
      return;
    }

    addHabit({
      title: `${selectedEmoji} ${title}`,
      goal: goalNumber,
      unit: unit.trim() || "vez",
      period,
      confettiColor: COLOR_PRESETS[selectedColorIndex],
    });

    // Reset form
    setTitle("");
    setGoal("1");
    setUnit("vez");
    setSelectedEmoji("🎯");
    setPeriod("Diario");

    Alert.alert("¡Éxito!", "Hábito creado correctamente");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.mainTitle}>✨ Crear Nuevo Hábito</Text>

      {/* Selector de Emoji */}
      <View style={styles.section}>
        <Text style={styles.label}>Elige un emoji</Text>
        <View style={styles.emojiGrid}>
          {EMOJI_OPTIONS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              onPress={() => setSelectedEmoji(emoji)}
              style={[
                styles.emojiButton,
                selectedEmoji === emoji && styles.selectedEmoji,
              ]}
            >
              <Text style={styles.emoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Nombre del hábito */}
      <View style={styles.section}>
        <Text style={styles.label}>Nombre del hábito</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Meditar, Estudiar, Hacer ejercicio..."
          placeholderTextColor="#64748b"
          value={title}
          onChangeText={setTitle}
        />
      </View>

      {/* Meta y unidad */}
      <View style={styles.section}>
        <Text style={styles.label}>Meta</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.smallInput]}
            placeholder="1"
            placeholderTextColor="#64748b"
            keyboardType="numeric"
            value={goal}
            onChangeText={setGoal}
          />
          <TextInput
            style={[styles.input, styles.flexInput]}
            placeholder="Ej: páginas, minutos, veces..."
            placeholderTextColor="#64748b"
            value={unit}
            onChangeText={setUnit}
          />
        </View>
      </View>

      {/* Período */}
      <View style={styles.section}>
        <Text style={styles.label}>Frecuencia</Text>
        <View style={styles.periodRow}>
          {(["Diario", "Semanal", "Mensual"] as Period[]).map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriod(p)}
              style={[
                styles.periodButton,
                period === p && styles.activePeriodButton,
              ]}
            >
              <Text
                style={[
                  styles.periodText,
                  period === p && styles.activePeriodText,
                ]}
              >
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Color del confeti */}
      <View style={styles.section}>
        <Text style={styles.label}>Color de celebración</Text>
        <View style={styles.colorRow}>
          {COLOR_PRESETS.map((colors, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setSelectedColorIndex(index)}
              style={[
                styles.colorButton,
                selectedColorIndex === index && styles.selectedColor,
              ]}
            >
              <View style={styles.colorPreview}>
                {colors.map((color, i) => (
                  <View
                    key={i}
                    style={[styles.colorDot, { backgroundColor: color }]}
                  />
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Preview */}
      <View style={styles.preview}>
        <Text style={styles.previewLabel}>Vista previa:</Text>
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>
            {selectedEmoji} {title || "Nombre del hábito"}
          </Text>
          <Text style={styles.previewSubtitle}>
            0 / {goal} {unit}
          </Text>
        </View>
      </View>

      {/* Botón crear */}
      <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
        <Text style={styles.createButtonText}>🎉 Crear Hábito</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#f8fafc",
    marginBottom: 30,
    textAlign: "center",
  },
  section: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#cbd5e1",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: "#f8fafc",
    borderWidth: 1,
    borderColor: "#334155",
  },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  emojiButton: {
    width: 50,
    height: 50,
    backgroundColor: "#1e293b",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#334155",
  },
  selectedEmoji: {
    borderColor: "#38bdf8",
    backgroundColor: "#1e3a5f",
  },
  emoji: {
    fontSize: 24,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  smallInput: {
    width: 80,
  },
  flexInput: {
    flex: 1,
  },
  periodRow: {
    flexDirection: "row",
    gap: 10,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#1e293b",
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#334155",
  },
  activePeriodButton: {
    backgroundColor: "#38bdf8",
    borderColor: "#38bdf8",
  },
  periodText: {
    color: "#94a3b8",
    fontWeight: "600",
  },
  activePeriodText: {
    color: "#0f172a",
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  colorButton: {
    padding: 8,
    backgroundColor: "#1e293b",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#334155",
  },
  selectedColor: {
    borderColor: "#38bdf8",
  },
  colorPreview: {
    flexDirection: "row",
    gap: 4,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  preview: {
    marginTop: 10,
    marginBottom: 20,
  },
  previewLabel: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: 10,
  },
  previewCard: {
    backgroundColor: "#1e293b",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#f8fafc",
  },
  previewSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: "#94a3b8",
  },
  createButton: {
    backgroundColor: "#22c55e",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
  },
  createButtonText: {
    color: "#022c22",
    fontSize: 18,
    fontWeight: "bold",
  },
});
