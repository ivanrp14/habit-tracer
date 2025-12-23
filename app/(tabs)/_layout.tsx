import { Tabs } from "expo-router";
import { Text } from "react-native";
import { HabitsProvider } from "../../context/HabitsContext";

export default function TabLayout() {
  return (
    <HabitsProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#1e293b",
            borderTopColor: "#334155",
            height: 70,
            paddingBottom: 10,
            paddingTop: 10,
          },
          tabBarActiveTintColor: "#38bdf8",
          tabBarInactiveTintColor: "#64748b",
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Hábitos",
            tabBarIcon: ({ color, size }) => (
              <TabIcon icon="🌱" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="create"
          options={{
            title: "Crear",
            tabBarIcon: ({ color, size }) => (
              <TabIcon icon="➕" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: "Estadísticas",
            tabBarIcon: ({ color, size }) => (
              <TabIcon icon="📊" color={color} size={size} />
            ),
          }}
        />
      </Tabs>
    </HabitsProvider>
  );
}

function TabIcon({
  icon,
  size,
}: {
  icon: string;
  color: string;
  size: number;
}) {
  return (
    <Text style={{ fontSize: size * 1.2, lineHeight: size * 1.5 }}>{icon}</Text>
  );
}
