import * as SQLite from 'expo-sqlite';
import { Habit, Period } from '../context/HabitsContext';

const db = SQLite.openDatabaseSync('habits.db');

// Inicializar todas las tablas
export const initDatabase = () => {
  // Tabla principal de hábitos
  db.execSync(`
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      progress INTEGER NOT NULL DEFAULT 0,
      goal INTEGER NOT NULL,
      unit TEXT NOT NULL,
      period TEXT NOT NULL,
      confettiColor TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      lastReset TEXT,
      isActive INTEGER NOT NULL DEFAULT 1
    );
  `);

  // Tabla de historial (cada vez que se completa un incremento)
  db.execSync(`
    CREATE TABLE IF NOT EXISTS habit_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habitId TEXT NOT NULL,
      completedAt TEXT NOT NULL,
      progressValue INTEGER NOT NULL,
      FOREIGN KEY (habitId) REFERENCES habits (id) ON DELETE CASCADE
    );
  `);

  // Tabla de estadísticas diarias
  db.execSync(`
    CREATE TABLE IF NOT EXISTS daily_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      totalCompleted INTEGER NOT NULL DEFAULT 0,
      totalHabits INTEGER NOT NULL DEFAULT 0,
      completionRate REAL NOT NULL DEFAULT 0
    );
  `);

  // Índices para mejor performance
  db.execSync(`
    CREATE INDEX IF NOT EXISTS idx_habit_history_habitId 
    ON habit_history(habitId);
  `);
  
  db.execSync(`
    CREATE INDEX IF NOT EXISTS idx_habit_history_date 
    ON habit_history(completedAt);
  `);

  db.execSync(`
    CREATE INDEX IF NOT EXISTS idx_habits_period 
    ON habits(period);
  `);
};

// ==================== CRUD de Hábitos ====================

export const getAllHabits = (): Habit[] => {
  const result = db.getAllSync(
    'SELECT * FROM habits WHERE isActive = 1 ORDER BY createdAt DESC'
  ) as any[];
  
  return result.map((row) => ({
    id: row.id,
    title: row.title,
    progress: row.progress,
    goal: row.goal,
    unit: row.unit,
    period: row.period as Period,
    confettiColor: JSON.parse(row.confettiColor),
    createdAt: new Date(row.createdAt),
  }));
};

export const getHabitsByPeriod = (period: Period): Habit[] => {
  const result = db.getAllSync(
    'SELECT * FROM habits WHERE period = ? AND isActive = 1 ORDER BY createdAt DESC',
    [period]
  ) as any[];
  
  return result.map((row) => ({
    id: row.id,
    title: row.title,
    progress: row.progress,
    goal: row.goal,
    unit: row.unit,
    period: row.period as Period,
    confettiColor: JSON.parse(row.confettiColor),
    createdAt: new Date(row.createdAt),
  }));
};

export const getHabitById = (id: string): Habit | null => {
  const result = db.getFirstSync(
    'SELECT * FROM habits WHERE id = ? AND isActive = 1',
    [id]
  ) as any;
  
  if (!result) return null;
  
  return {
    id: result.id,
    title: result.title,
    progress: result.progress,
    goal: result.goal,
    unit: result.unit,
    period: result.period as Period,
    confettiColor: JSON.parse(result.confettiColor),
    createdAt: new Date(result.createdAt),
  };
};

export const insertHabit = (habit: Habit): void => {
  db.runSync(
    `INSERT INTO habits 
    (id, title, progress, goal, unit, period, confettiColor, createdAt, lastReset) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      habit.id,
      habit.title,
      habit.progress,
      habit.goal,
      habit.unit,
      habit.period,
      JSON.stringify(habit.confettiColor),
      habit.createdAt.toISOString(),
      habit.createdAt.toISOString(),
    ]
  );
};

export const updateHabitProgress = (id: string, progress: number): void => {
  db.runSync(
    'UPDATE habits SET progress = ? WHERE id = ?',
    [progress, id]
  );
  
  // Registrar en el historial
  db.runSync(
    'INSERT INTO habit_history (habitId, completedAt, progressValue) VALUES (?, ?, ?)',
    [id, new Date().toISOString(), progress]
  );
};

export const deleteHabit = (id: string): void => {
  // Soft delete: marcamos como inactivo en lugar de eliminar
  db.runSync('UPDATE habits SET isActive = 0 WHERE id = ?', [id]);
};

export const resetHabitProgress = (id: string): void => {
  const now = new Date().toISOString();
  db.runSync(
    'UPDATE habits SET progress = 0, lastReset = ? WHERE id = ?',
    [now, id]
  );
};

// ==================== Historial ====================

export const getHabitHistory = (habitId: string, limit: number = 30) => {
  const result = db.getAllSync(
    `SELECT * FROM habit_history 
     WHERE habitId = ? 
     ORDER BY completedAt DESC 
     LIMIT ?`,
    [habitId, limit]
  ) as any[];
  
  return result.map((row) => ({
    id: row.id,
    habitId: row.habitId,
    completedAt: new Date(row.completedAt),
    progressValue: row.progressValue,
  }));
};

export const getCompletionHistory = (days: number = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const result = db.getAllSync(
    `SELECT 
       DATE(completedAt) as date,
       COUNT(DISTINCT habitId) as habitsCompleted,
       COUNT(*) as totalCompletions
     FROM habit_history
     WHERE completedAt >= ?
     GROUP BY DATE(completedAt)
     ORDER BY date DESC`,
    [startDate.toISOString()]
  ) as any[];
  
  return result.map((row) => ({
    date: row.date,
    habitsCompleted: row.habitsCompleted,
    totalCompletions: row.totalCompletions,
  }));
};

// ==================== Estadísticas ====================

export const updateDailyStats = (): void => {
  const today = new Date().toISOString().split('T')[0];
  const habits = getAllHabits();
  const completed = habits.filter((h) => h.progress >= h.goal).length;
  const total = habits.length;
  const rate = total > 0 ? (completed / total) * 100 : 0;

  db.runSync(
    `INSERT OR REPLACE INTO daily_stats (date, totalCompleted, totalHabits, completionRate)
     VALUES (?, ?, ?, ?)`,
    [today, completed, total, rate]
  );
};

export const getDailyStats = (days: number = 30) => {
  const result = db.getAllSync(
    `SELECT * FROM daily_stats 
     ORDER BY date DESC 
     LIMIT ?`,
    [days]
  ) as any[];
  
  return result.map((row) => ({
    date: row.date,
    totalCompleted: row.totalCompleted,
    totalHabits: row.totalHabits,
    completionRate: row.completionRate,
  }));
};

export const getStreakForHabit = (habitId: string): number => {
  const habit = getHabitById(habitId);
  if (!habit) return 0;

  const history = getHabitHistory(habitId, 365);
  let streak = 0;
  let currentDate = new Date();

  for (const entry of history) {
    const entryDate = new Date(entry.completedAt);
    entryDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor(
      (currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === streak) {
      streak++;
    } else if (diffDays > streak) {
      break;
    }
  }

  return streak;
};

export const getTotalCompletions = (): number => {
  const result = db.getFirstSync(
    'SELECT COUNT(*) as total FROM habit_history'
  ) as any;
  return result?.total || 0;
};

export const getMostCompletedHabit = () => {
  const result = db.getFirstSync(
    `SELECT 
       h.id, h.title, COUNT(*) as completions
     FROM habit_history hh
     JOIN habits h ON h.id = hh.habitId
     WHERE h.isActive = 1
     GROUP BY hh.habitId
     ORDER BY completions DESC
     LIMIT 1`
  ) as any;
  
  if (!result) return null;
  
  return {
    id: result.id,
    title: result.title,
    completions: result.completions,
  };
};

// ==================== Reset automático ====================

export const checkAndResetHabits = (): void => {
  const habits = getAllHabits();
  const now = new Date();

  for (const habit of habits) {
    const lastResetResult = db.getFirstSync(
      'SELECT lastReset FROM habits WHERE id = ?',
      [habit.id]
    ) as any;

    if (!lastResetResult?.lastReset) continue;

    const lastReset = new Date(lastResetResult.lastReset);
    let shouldReset = false;

    if (habit.period === 'Diario') {
      shouldReset = now.toDateString() !== lastReset.toDateString();
    } else if (habit.period === 'Semanal') {
      const weeksDiff = getWeeksDifference(lastReset, now);
      shouldReset = weeksDiff >= 1;
    } else if (habit.period === 'Mensual') {
      shouldReset =
        now.getMonth() !== lastReset.getMonth() ||
        now.getFullYear() !== lastReset.getFullYear();
    }

    if (shouldReset) {
      resetHabitProgress(habit.id);
    }
  }
};

// Calcular diferencia en semanas
function getWeeksDifference(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7);
}

// ==================== Utilidades ====================

export const clearAllData = (): void => {
  db.execSync('DELETE FROM habit_history');
  db.execSync('DELETE FROM daily_stats');
  db.execSync('DELETE FROM habits');
};

export const getDbInfo = () => {
  const habitsCount = db.getFirstSync('SELECT COUNT(*) as count FROM habits WHERE isActive = 1') as any;
  const historyCount = db.getFirstSync('SELECT COUNT(*) as count FROM habit_history') as any;
  const statsCount = db.getFirstSync('SELECT COUNT(*) as count FROM daily_stats') as any;

  return {
    totalHabits: habitsCount?.count || 0,
    totalHistory: historyCount?.count || 0,
    totalStats: statsCount?.count || 0,
  };
};