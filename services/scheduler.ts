import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { checkAndResetHabits, updateDailyStats, getAllHabits } from './database';

// Nombres de las tareas
const RESET_HABITS_TASK = 'reset-habits-task';
const UPDATE_STATS_TASK = 'update-stats-task';
const REMINDER_TASK = 'reminder-task';

// ==================== Configuración de Notificaciones ====================

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ==================== Tareas en Background ====================

// Tarea 1: Reset de hábitos según su período
TaskManager.defineTask(RESET_HABITS_TASK, async () => {
  try {
    console.log('[Background] Ejecutando reset de hábitos...');
    checkAndResetHabits();
    console.log('[Background] Reset completado');
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('[Background] Error al resetear hábitos:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Tarea 2: Actualizar estadísticas diarias
TaskManager.defineTask(UPDATE_STATS_TASK, async () => {
  try {
    console.log('[Background] Actualizando estadísticas...');
    updateDailyStats();
    console.log('[Background] Estadísticas actualizadas');
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('[Background] Error al actualizar stats:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Tarea 3: Recordatorios de hábitos pendientes
TaskManager.defineTask(REMINDER_TASK, async () => {
  try {
    console.log('[Background] Verificando hábitos pendientes...');
    const habits = getAllHabits();
    const pending = habits.filter((h) => h.progress < h.goal);

    if (pending.length > 0) {
      await sendReminderNotification(pending.length);
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('[Background] Error en recordatorios:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// ==================== Registro de Tareas ====================

export const registerBackgroundTasks = async () => {
  try {
    // Verificar si las tareas ya están registradas
    const registeredTasks = await TaskManager.getRegisteredTasksAsync();
    const taskNames = registeredTasks.map((task) => task.taskName);

    // Registrar tarea de reset (cada 1 hora para ser más preciso)
    if (!taskNames.includes(RESET_HABITS_TASK)) {
      try {
        await BackgroundFetch.registerTaskAsync(RESET_HABITS_TASK, {
          minimumInterval: 60 * 60, // 1 hora (cambiado de 6 horas)
          stopOnTerminate: false,
          startOnBoot: true,
        });
        console.log('[Scheduler] Tarea de reset registrada (cada 1h)');
      } catch (error) {
        console.warn('[Scheduler] No se pudo registrar tarea de reset (puede que no esté configurado en app.json):', error);
      }
    }

    // Registrar tarea de stats (cada 12 horas)
    if (!taskNames.includes(UPDATE_STATS_TASK)) {
      try {
        await BackgroundFetch.registerTaskAsync(UPDATE_STATS_TASK, {
          minimumInterval: 60 * 60 * 12, // 12 horas
          stopOnTerminate: false,
          startOnBoot: true,
        });
        console.log('[Scheduler] Tarea de stats registrada');
      } catch (error) {
        console.warn('[Scheduler] No se pudo registrar tarea de stats:', error);
      }
    }

    // Registrar tarea de recordatorios (cada 8 horas)
    if (!taskNames.includes(REMINDER_TASK)) {
      try {
        await BackgroundFetch.registerTaskAsync(REMINDER_TASK, {
          minimumInterval: 60 * 60 * 8, // 8 horas
          stopOnTerminate: false,
          startOnBoot: true,
        });
        console.log('[Scheduler] Tarea de recordatorios registrada');
      } catch (error) {
        console.warn('[Scheduler] No se pudo registrar tarea de recordatorios:', error);
      }
    }

    console.log('[Scheduler] Registro de tareas completado');
  } catch (error) {
    console.warn('[Scheduler] Error general al registrar tareas:', error);
    console.log('[Scheduler] La app funcionará sin tareas en background. Agrega "fetch" a UIBackgroundModes en app.json para habilitarlas.');
  }
};

export const unregisterBackgroundTasks = async () => {
  try {
    await BackgroundFetch.unregisterTaskAsync(RESET_HABITS_TASK);
    await BackgroundFetch.unregisterTaskAsync(UPDATE_STATS_TASK);
    await BackgroundFetch.unregisterTaskAsync(REMINDER_TASK);
    console.log('[Scheduler] Tareas desregistradas');
  } catch (error) {
    console.error('[Scheduler] Error al desregistrar tareas:', error);
  }
};

export const getTasksStatus = async () => {
  try {
    const tasks = await TaskManager.getRegisteredTasksAsync();
    return tasks.map((task) => ({
      name: task.taskName,
      isRegistered: true,
    }));
  } catch (error) {
    console.error('[Scheduler] Error al obtener estado:', error);
    return [];
  }
};

// ==================== Sistema de Notificaciones ====================

export const requestNotificationPermissions = async (): Promise<boolean> => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Notifications] Permisos denegados');
    return false;
  }

  console.log('[Notifications] Permisos concedidos');
  return true;
};

export const sendReminderNotification = async (pendingCount: number) => {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌱 Recordatorio de Hábitos',
      body: `Tienes ${pendingCount} hábito${pendingCount > 1 ? 's' : ''} pendiente${pendingCount > 1 ? 's' : ''} por completar hoy`,
      data: { type: 'reminder' },
      sound: true,
    },
    trigger: null, // Enviar inmediatamente
  });
};

export const sendCompletionNotification = async (habitTitle: string) => {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '✨ ¡Hábito Completado!',
      body: `Has completado: ${habitTitle}`,
      data: { type: 'completion' },
      sound: true,
    },
    trigger: null,
  });
};

// ==================== Notificaciones Programadas ====================

export const scheduleDailyReminder = async (hour: number, minute: number) => {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return null;

  // Cancelar recordatorios previos
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Programar nueva notificación diaria
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌱 Hora de tus Hábitos',
      body: '¡Es momento de trabajar en tus hábitos diarios!',
      data: { type: 'daily-reminder' },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      repeats: true,
    },
  });

  console.log(`[Notifications] Recordatorio diario programado a las ${hour}:${minute}`);
  return id;
};

export const cancelAllReminders = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('[Notifications] Todos los recordatorios cancelados');
};

export const getScheduledNotifications = async () => {
  const notifications = await Notifications.getAllScheduledNotificationsAsync();
  return notifications.map((notif) => ({
    id: notif.identifier,
    trigger: notif.trigger,
    content: notif.content,
  }));
};

// ==================== Testing / Debug ====================

export const testBackgroundTask = async () => {
  try {
    console.log('[Test] Ejecutando reset manual...');
    checkAndResetHabits();
    updateDailyStats();
    console.log('[Test] Reset completado exitosamente');
    return true;
  } catch (error) {
    console.error('[Test] Error:', error);
    return false;
  }
};

export const testNotification = async () => {
  try {
    await sendReminderNotification(3);
    console.log('[Test] Notificación de prueba enviada');
    return true;
  } catch (error) {
    console.error('[Test] Error al enviar notificación:', error);
    return false;
  }
};

// ==================== Inicialización ====================

export const initializeScheduler = async () => {
  try {
    console.log('[Scheduler] Inicializando sistema de tareas...');

    // Solicitar permisos de notificaciones
    const hasPermissions = await requestNotificationPermissions();
    
    if (!hasPermissions) {
      console.log('[Scheduler] Permisos de notificaciones no concedidos');
    }

    // Registrar tareas en background (puede fallar si no está configurado)
    await registerBackgroundTasks();

    // Programar recordatorio diario a las 20:00 por defecto (opcional)
    if (hasPermissions) {
      try {
        await scheduleDailyReminder(20, 0);
      } catch (error) {
        console.warn('[Scheduler] No se pudo programar recordatorio diario:', error);
      }
    }

    console.log('[Scheduler] Sistema inicializado');
    return true;
  } catch (error) {
    console.warn('[Scheduler] Error en inicialización:', error);
    console.log('[Scheduler] La app funcionará sin notificaciones y tareas en background');
    return false;
  }
};