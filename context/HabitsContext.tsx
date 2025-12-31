import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import * as DB from "../services/database";

export type Period = "Diario" | "Semanal" | "Mensual";

export type Habit = {
  id: string;
  title: string;
  progress: number;
  goal: number;
  unit: string;
  period: Period;
  confettiColor: string[];
  createdAt: Date;
};

type HabitsContextType = {
  habits: Habit[];
  loading: boolean;
  addHabit: (
    habit: Omit<Habit, "id" | "createdAt" | "progress">
  ) => Promise<void>;
  updateHabitProgress: (id: string, increment: number) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  resetHabitProgress: (id: string) => Promise<void>;
  getHabitsByPeriod: (period: Period) => Habit[];
  refreshHabits: () => Promise<void>;
};

const HabitsContext = createContext<HabitsContextType | undefined>(undefined);

const DEFAULT_HABITS: Omit<Habit, "id" | "progress">[] = [
  {
    title: "📘 Leer",
    goal: 20,
    unit: "páginas",
    period: "Diario",
    confettiColor: ["#FFD700", "#FF5733", "#33FF57"],
    createdAt: new Date(),
  },
  {
    title: "🏃 Deporte",
    goal: 1,
    unit: "sesión",
    period: "Diario",
    confettiColor: ["#38bdf8", "#22c55e", "#facc15"],
    createdAt: new Date(),
  },
  {
    title: "🍎 Comer sano",
    goal: 1,
    unit: "día",
    period: "Diario",
    confettiColor: ["#ff69b4", "#ff4500", "#8a2be2"],
    createdAt: new Date(),
  },
  {
    title: "📝 Planificar semana",
    goal: 1,
    unit: "vez",
    period: "Semanal",
    confettiColor: ["#00FFFF", "#FF00FF", "#FFFF00"],
    createdAt: new Date(),
  },
  {
    title: "📊 Revisar finanzas",
    goal: 1,
    unit: "vez",
    period: "Mensual",
    confettiColor: ["#FFA500", "#800080", "#008000"],
    createdAt: new Date(),
  },
];

export function HabitsProvider({ children }: { children: ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  // Inicializar base de datos y cargar datos
  useEffect(() => {
    const init = async () => {
      try {
        console.log("[DB] Inicializando base de datos...");

        // Inicializar database
        DB.initDatabase();

        // Inicializar scheduler (tareas en background)

        // Verificar y resetear hábitos si es necesario
        DB.checkAndResetHabits();

        // Cargar hábitos
        const loadedHabits = DB.getAllHabits();

        // Si no hay hábitos, insertar los de ejemplo
        if (loadedHabits.length === 0) {
          console.log("[DB] No hay hábitos, insertando ejemplos...");
          for (const habitData of DEFAULT_HABITS) {
            const habit: Habit = {
              ...habitData,
              id: Date.now().toString() + Math.random(),
              progress: 0,
            };
            DB.insertHabit(habit);
          }
          setHabits(DB.getAllHabits());
        } else {
          setHabits(loadedHabits);
        }

        console.log("[DB] Inicialización completada");
      } catch (error) {
        console.error("[DB] Error en inicialización:", error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const refreshHabits = async () => {
    try {
      const loadedHabits = DB.getAllHabits();
      setHabits(loadedHabits);
    } catch (error) {
      console.error("[DB] Error al refrescar hábitos:", error);
    }
  };

  const addHabit = async (
    newHabit: Omit<Habit, "id" | "createdAt" | "progress">
  ) => {
    try {
      const habit: Habit = {
        ...newHabit,
        id: Date.now().toString(),
        progress: 0,
        createdAt: new Date(),
      };

      DB.insertHabit(habit);
      setHabits((prev) => [...prev, habit]);

      // Crear backup automático después de cambios importantes

      console.log("[DB] Hábito agregado:", habit.title);
    } catch (error) {
      console.error("[DB] Error al agregar hábito:", error);
      throw error;
    }
  };

  const updateHabitProgress = async (id: string, increment: number) => {
    try {
      const habit = habits.find((h) => h.id === id);
      if (!habit) return;

      const newProgress = Math.max(
        0,
        Math.min(habit.goal, habit.progress + increment)
      );

      DB.updateHabitProgress(id, newProgress);
      setHabits((prev) =>
        prev.map((h) => (h.id === id ? { ...h, progress: newProgress } : h))
      );

      // Actualizar estadísticas diarias
      DB.updateDailyStats();

      console.log("[DB] Progreso actualizado:", habit.title, newProgress);
    } catch (error) {
      console.error("[DB] Error al actualizar progreso:", error);
      throw error;
    }
  };

  const deleteHabit = async (id: string) => {
    try {
      DB.deleteHabit(id);
      setHabits((prev) => prev.filter((h) => h.id !== id));

      // Backup después de eliminar

      console.log("[DB] Hábito eliminado:", id);
    } catch (error) {
      console.error("[DB] Error al eliminar hábito:", error);
      throw error;
    }
  };

  const resetHabitProgress = async (id: string) => {
    try {
      DB.resetHabitProgress(id);
      setHabits((prev) =>
        prev.map((h) => (h.id === id ? { ...h, progress: 0 } : h))
      );

      console.log("[DB] Progreso reseteado:", id);
    } catch (error) {
      console.error("[DB] Error al resetear progreso:", error);
      throw error;
    }
  };

  const getHabitsByPeriod = (period: Period): Habit[] => {
    return habits.filter((h) => h.period === period);
  };

  return (
    <HabitsContext.Provider
      value={{
        habits,
        loading,
        addHabit,
        updateHabitProgress,
        deleteHabit,
        resetHabitProgress,
        getHabitsByPeriod,
        refreshHabits,
      }}
    >
      {children}
    </HabitsContext.Provider>
  );
}

export function useHabits() {
  const context = useContext(HabitsContext);
  if (!context) {
    throw new Error("useHabits must be used within HabitsProvider");
  }
  return context;
}
