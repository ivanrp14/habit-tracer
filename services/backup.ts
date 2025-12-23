import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { Habit } from '../context/HabitsContext';
import {
    clearAllData,
    getAllHabits,
    getDailyStats,
    getHabitHistory,
    initDatabase,
    insertHabit,
} from './database';

const BACKUP_DIR = FileSystem.documentDirectory + 'backups/';
const AUTO_BACKUP_FILE = BACKUP_DIR + 'auto_backup.json';

// ==================== Estructura de Backup ====================

interface BackupData {
  version: string;
  timestamp: string;
  habits: any[];
  history: any[];
  stats: any[];
  metadata: {
    totalHabits: number;
    totalCompletions: number;
    exportedBy: string;
  };
}

// ==================== Crear Backups ====================

export const createBackup = async (): Promise<BackupData> => {
  try {
    const habits = getAllHabits();
    const stats = getDailyStats(365);

    // Obtener historial de todos los hábitos
    const allHistory = habits.flatMap((habit) => {
      const history = getHabitHistory(habit.id, 1000);
      return history.map((h) => ({
        ...h,
        habitTitle: habit.title,
      }));
    });

    const backup: BackupData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      habits: habits.map((h) => ({
        id: h.id,
        title: h.title,
        progress: h.progress,
        goal: h.goal,
        unit: h.unit,
        period: h.period,
        confettiColor: h.confettiColor,
        createdAt: h.createdAt.toISOString(),
      })),
      history: allHistory.map((h) => ({
        habitId: h.habitId,
        habitTitle: h.habitTitle,
        completedAt: h.completedAt.toISOString(),
        progressValue: h.progressValue,
      })),
      stats: stats,
      metadata: {
        totalHabits: habits.length,
        totalCompletions: allHistory.length,
        exportedBy: 'HabitsApp v1.0',
      },
    };

    return backup;
  } catch (error) {
    console.error('[Backup] Error al crear backup:', error);
    throw error;
  }
};

// ==================== Exportar Backups ====================

export const exportBackupJSON = async (): Promise<boolean> => {
  try {
    const backup = await createBackup();
    const filename = `habits_backup_${new Date().toISOString().split('T')[0]}.json`;
    const fileUri = FileSystem.documentDirectory + filename;

    // Guardar archivo
    await FileSystem.writeAsStringAsync(
      fileUri,
      JSON.stringify(backup, null, 2),
      { encoding: FileSystem.EncodingType.UTF8 }
    );

    // Compartir archivo
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Exportar Backup de Hábitos',
      });
    }

    Alert.alert('✅ Éxito', 'Backup exportado correctamente');
    return true;
  } catch (error) {
    console.error('[Backup] Error al exportar JSON:', error);
    Alert.alert('❌ Error', 'No se pudo exportar el backup');
    return false;
  }
};

export const exportBackupCSV = async (): Promise<boolean> => {
  try {
    const habits = getAllHabits();
    
    // Header CSV
    let csv = 'Título,Progreso,Meta,Unidad,Período,Fecha Creación\n';

    // Datos
    habits.forEach((habit) => {
      csv += `"${habit.title}",${habit.progress},${habit.goal},"${habit.unit}","${habit.period}","${habit.createdAt.toISOString()}"\n`;
    });

    const filename = `habits_${new Date().toISOString().split('T')[0]}.csv`;
    const fileUri = FileSystem.documentDirectory + filename;

    await FileSystem.writeAsStringAsync(fileUri, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Exportar Hábitos CSV',
      });
    }

    Alert.alert('✅ Éxito', 'CSV exportado correctamente');
    return true;
  } catch (error) {
    console.error('[Backup] Error al exportar CSV:', error);
    Alert.alert('❌ Error', 'No se pudo exportar el CSV');
    return false;
  }
};

// ==================== Importar Backups ====================

export const importBackup = async (): Promise<boolean> => {
  try {
    // Seleccionar archivo
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return false;
    }

    const fileUri = result.assets[0].uri;

    // Leer contenido
    const content = await FileSystem.readAsStringAsync(fileUri);
    const backup: BackupData = JSON.parse(content);

    // Validar estructura
    if (!backup.version || !backup.habits || !Array.isArray(backup.habits)) {
      Alert.alert('❌ Error', 'Formato de backup inválido');
      return false;
    }

    // Confirmar importación
    return new Promise((resolve) => {
      Alert.alert(
        '⚠️ Confirmar Importación',
        `Esto eliminará todos tus datos actuales y restaurará:\n\n• ${backup.metadata.totalHabits} hábitos\n• ${backup.metadata.totalCompletions} registros\n\n¿Continuar?`,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Importar',
            style: 'destructive',
            onPress: async () => {
              const success = await restoreBackup(backup);
              resolve(success);
            },
          },
        ]
      );
    });
  } catch (error) {
    console.error('[Backup] Error al importar:', error);
    Alert.alert('❌ Error', 'No se pudo importar el backup');
    return false;
  }
};

const restoreBackup = async (backup: BackupData): Promise<boolean> => {
  try {
    // Limpiar datos actuales
    clearAllData();

    // Reinicializar DB
    initDatabase();

    // Restaurar hábitos
    for (const habitData of backup.habits) {
      const habit: Habit = {
        id: habitData.id,
        title: habitData.title,
        progress: habitData.progress,
        goal: habitData.goal,
        unit: habitData.unit,
        period: habitData.period,
        confettiColor: habitData.confettiColor,
        createdAt: new Date(habitData.createdAt),
      };
      insertHabit(habit);
    }

    Alert.alert(
      '✅ Restauración Completada',
      `Se restauraron ${backup.habits.length} hábitos correctamente`
    );
    return true;
  } catch (error) {
    console.error('[Backup] Error al restaurar:', error);
    Alert.alert('❌ Error', 'No se pudo restaurar el backup');
    return false;
  }
};

// ==================== Backup Automático ====================

export const createAutoBackup = async (): Promise<boolean> => {
  try {
    // Crear directorio si no existe
    const dirInfo = await FileSystem.getInfoAsync(BACKUP_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(BACKUP_DIR, { intermediates: true });
    }

    const backup = await createBackup();

    await FileSystem.writeAsStringAsync(
      AUTO_BACKUP_FILE,
      JSON.stringify(backup),
      { encoding: FileSystem.EncodingType.UTF8 }
    );

    console.log('[Backup] Auto-backup creado exitosamente');
    return true;
  } catch (error) {
    console.error('[Backup] Error en auto-backup:', error);
    return false;
  }
};

export const restoreAutoBackup = async (): Promise<boolean> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(AUTO_BACKUP_FILE);
    if (!fileInfo.exists) {
      Alert.alert('ℹ️ Info', 'No hay backup automático disponible');
      return false;
    }

    const content = await FileSystem.readAsStringAsync(AUTO_BACKUP_FILE);
    const backup: BackupData = JSON.parse(content);

    const success = await restoreBackup(backup);
    return success;
  } catch (error) {
    console.error('[Backup] Error al restaurar auto-backup:', error);
    Alert.alert('❌ Error', 'No se pudo restaurar el backup automático');
    return false;
  }
};

export const deleteAutoBackup = async (): Promise<boolean> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(AUTO_BACKUP_FILE);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(AUTO_BACKUP_FILE);
      console.log('[Backup] Auto-backup eliminado');
    }
    return true;
  } catch (error) {
    console.error('[Backup] Error al eliminar auto-backup:', error);
    return false;
  }
};

// ==================== Gestión de Backups ====================

export const getBackupInfo = async () => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(AUTO_BACKUP_FILE);

    if (!fileInfo.exists) {
      return null;
    }

    const content = await FileSystem.readAsStringAsync(AUTO_BACKUP_FILE);
    const backup: BackupData = JSON.parse(content);

    return {
      exists: true,
      timestamp: backup.timestamp,
      habitCount: backup.metadata.totalHabits,
      completionCount: backup.metadata.totalCompletions,
      size: fileInfo.size,
    };
  } catch (error) {
    console.error('[Backup] Error al obtener info:', error);
    return null;
  }
};

export const cleanOldBackups = async (daysToKeep: number = 30): Promise<void> => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(BACKUP_DIR);
    if (!dirInfo.exists) return;

    const files = await FileSystem.readDirectoryAsync(BACKUP_DIR);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    for (const file of files) {
      if (!file.startsWith('habits_backup_')) continue;

      const filePath = BACKUP_DIR + file;
      const fileInfo = await FileSystem.getInfoAsync(filePath);

      if (fileInfo.exists && fileInfo.modificationTime) {
        const fileDate = new Date(fileInfo.modificationTime * 1000);
        if (fileDate < cutoffDate) {
          await FileSystem.deleteAsync(filePath);
          console.log(`[Backup] Eliminado backup antiguo: ${file}`);
        }
      }
    }
  } catch (error) {
    console.error('[Backup] Error al limpiar backups:', error);
  }
};

// ==================== Utilidades ====================

export const getBackupSize = async (): Promise<number> => {
  try {
    const backup = await createBackup();
    const jsonString = JSON.stringify(backup);
    const bytes = new Blob([jsonString]).size;
    return bytes;
  } catch (error) {
    console.error('[Backup] Error al calcular tamaño:', error);
    return 0;
  }
};

export const validateBackupFile = async (fileUri: string): Promise<boolean> => {
  try {
    const content = await FileSystem.readAsStringAsync(fileUri);
    const backup: BackupData = JSON.parse(content);

    return !!(
      backup.version &&
      backup.timestamp &&
      backup.habits &&
      Array.isArray(backup.habits) &&
      backup.metadata
    );
  } catch (error) {
    return false;
  }
};

// ==================== Formato Legible ====================

export const exportReadableReport = async (): Promise<boolean> => {
  try {
    const habits = getAllHabits();
    const stats = getDailyStats(30);

    let report = '═══════════════════════════════════════\n';
    report += '          📊 REPORTE DE HÁBITOS\n';
    report += '═══════════════════════════════════════\n\n';
    report += `Fecha: ${new Date().toLocaleDateString()}\n`;
    report += `Total de hábitos: ${habits.length}\n\n`;

    report += '───────────────────────────────────────\n';
    report += 'HÁBITOS ACTIVOS\n';
    report += '───────────────────────────────────────\n\n';

    habits.forEach((habit, index) => {
      const percentage = ((habit.progress / habit.goal) * 100).toFixed(0);
      report += `${index + 1}. ${habit.title}\n`;
      report += `   Progreso: ${habit.progress}/${habit.goal} ${habit.unit} (${percentage}%)\n`;
      report += `   Período: ${habit.period}\n`;
      report += `   Creado: ${habit.createdAt.toLocaleDateString()}\n\n`;
    });

    if (stats.length > 0) {
      report += '───────────────────────────────────────\n';
      report += 'ESTADÍSTICAS (ÚLTIMOS 30 DÍAS)\n';
      report += '───────────────────────────────────────\n\n';

      const avgCompletion =
        stats.reduce((acc, s) => acc + s.completionRate, 0) / stats.length;

      report += `Promedio de completación: ${avgCompletion.toFixed(1)}%\n`;
      report += `Días registrados: ${stats.length}\n\n`;
    }

    report += '═══════════════════════════════════════\n';

    const filename = `reporte_habitos_${new Date().toISOString().split('T')[0]}.txt`;
    const fileUri = FileSystem.documentDirectory + filename;

    await FileSystem.writeAsStringAsync(fileUri, report, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri);
    }

    Alert.alert('✅ Éxito', 'Reporte generado correctamente');
    return true;
  } catch (error) {
    console.error('[Backup] Error al generar reporte:', error);
    Alert.alert('❌ Error', 'No se pudo generar el reporte');
    return false;
  }
};