import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Backup from "../services/backup";
import * as DB from "../services/database";
import * as Scheduler from "../services/scheduler";

export default function SettingsScreen() {
  const [backupInfo, setBackupInfo] = useState<any>(null);
  const [dbInfo, setDbInfo] = useState<any>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInfo();
  }, []);

  const loadInfo = async () => {
    const bInfo = await Backup.getBackupInfo();
    const dInfo = DB.getDbInfo();
    setBackupInfo(bInfo);
    setDbInfo(dInfo);
  };

  const handleExportJSON = async () => {
    setLoading(true);
    await Backup.exportBackupJSON();
    setLoading(false);
    loadInfo();
  };

  const handleExportCSV = async () => {
    setLoading(true);
    await Backup.exportBackupCSV();
    setLoading(false);
  };

  const handleExportReport = async () => {
    setLoading(true);
    await Backup.exportReadableReport();
    setLoading(false);
  };

  const handleImport = async () => {
    Alert.alert(
      "⚠️ Importar Backup",
      "Esto reemplazará todos tus datos actuales. ¿Continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Importar",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            const success = await Backup.importBackup();
            if (success) {
              loadInfo();
            }
            setLoading(false);
          },
        },
      ]
    );
  };

  const handleRestoreAutoBackup = async () => {
    if (!backupInfo) {
      Alert.alert("ℹ️ Info", "No hay backup automático disponible");
      return;
    }

    Alert.alert(
      "⚠️ Restaurar Backup Automático",
      `Restaurar backup del ${new Date(
        backupInfo.timestamp
      ).toLocaleString()}?\n\nHábitos: ${
        backupInfo.habitCount
      }\nCompletaciones: ${backupInfo.completionCount}`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Restaurar",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            await Backup.restoreAutoBackup();
            loadInfo();
            setLoading(false);
          },
        },
      ]
    );
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      "🗑️ Eliminar Todos los Datos",
      "Esta acción NO se puede deshacer. Se eliminarán todos los hábitos e historial.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            DB.clearAllData();
            DB.initDatabase();
            Alert.alert("✅", "Datos eliminados correctamente");
            loadInfo();
          },
        },
      ]
    );
  };

  const handleTestNotification = async () => {
    const success = await Scheduler.testNotification();
    if (success) {
      Alert.alert("✅", "Notificación de prueba enviada");
    }
  };

  const handleScheduleReminder = async () => {
    // Por ahora usa horario fijo, puedes agregar un picker de hora después
    const id = await Scheduler.scheduleDailyReminder(20, 0);
    if (id) {
      Alert.alert("✅", "Recordatorio diario programado a las 20:00");
      setNotificationsEnabled(true);
    }
  };

  const handleCancelReminders = async () => {
    await Scheduler.cancelAllReminders();
    Alert.alert("✅", "Recordatorios cancelados");
    setNotificationsEnabled(false);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.mainTitle}>⚙️ Configuración</Text>

      {/* Información de la Base de Datos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Información</Text>

        {dbInfo && (
          <View style={styles.infoCard}>
            <InfoRow label="Total de hábitos" value={dbInfo.totalHabits} />
            <InfoRow
              label="Historial de registros"
              value={dbInfo.totalHistory}
            />
            <InfoRow label="Días con estadísticas" value={dbInfo.totalStats} />
          </View>
        )}
      </View>

      {/* Backup Automático */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💾 Backup Automático</Text>

        {backupInfo ? (
          <View style={styles.infoCard}>
            <InfoRow
              label="Último backup"
              value={new Date(backupInfo.timestamp).toLocaleString()}
            />
            <InfoRow label="Hábitos" value={backupInfo.habitCount} />
            <InfoRow label="Tamaño" value={formatBytes(backupInfo.size)} />

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleRestoreAutoBackup}
            >
              <Text style={styles.buttonText}>🔄 Restaurar Backup</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.infoCard}>
            <Text style={styles.emptyText}>
              No hay backup automático disponible
            </Text>
          </View>
        )}
      </View>

      {/* Exportar Datos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📤 Exportar Datos</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={handleExportJSON}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Exportando..." : "📋 Exportar JSON (Completo)"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={handleExportCSV}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Exportando..." : "📊 Exportar CSV (Simple)"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={handleExportReport}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Generando..." : "📄 Generar Reporte"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Importar Datos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📥 Importar Datos</Text>

        <TouchableOpacity
          style={[styles.button, styles.warningButton]}
          onPress={handleImport}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Importando..." : "⚠️ Importar Backup JSON"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notificaciones */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔔 Notificaciones</Text>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Recordatorios diarios</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={(value) => {
              if (value) {
                handleScheduleReminder();
              } else {
                handleCancelReminders();
              }
            }}
            trackColor={{ false: "#334155", true: "#38bdf8" }}
            thumbColor={notificationsEnabled ? "#0ea5e9" : "#64748b"}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleTestNotification}
        >
          <Text style={styles.buttonText}>🧪 Probar Notificación</Text>
        </TouchableOpacity>

        <Text style={styles.helpText}>
          Los recordatorios te avisarán diariamente a las 20:00 sobre hábitos
          pendientes.
        </Text>
      </View>

      {/* Zona de Peligro */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, styles.dangerTitle]}>
          ⚠️ Zona de Peligro
        </Text>

        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={handleDeleteAllData}
        >
          <Text style={styles.buttonText}>🗑️ Eliminar Todos los Datos</Text>
        </TouchableOpacity>

        <Text style={styles.helpText}>
          Esta acción eliminará permanentemente todos tus hábitos, historial y
          estadísticas.
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Hábitos App v1.0.0</Text>
        <Text style={styles.footerText}>Con ❤️ y SQLite</Text>
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

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
  section: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#cbd5e1",
    marginBottom: 12,
  },
  dangerTitle: {
    color: "#ef4444",
  },
  infoCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  infoLabel: {
    fontSize: 14,
    color: "#94a3b8",
  },
  infoValue: {
    fontSize: 14,
    color: "#f8fafc",
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    fontStyle: "italic",
  },
  button: {
    backgroundColor: "#38bdf8",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  secondaryButton: {
    backgroundColor: "#334155",
  },
  warningButton: {
    backgroundColor: "#f59e0b",
  },
  dangerButton: {
    backgroundColor: "#ef4444",
  },
  buttonText: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "600",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  settingLabel: {
    fontSize: 16,
    color: "#f8fafc",
    fontWeight: "500",
  },
  helpText: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 10,
    lineHeight: 18,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 30,
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },
});
