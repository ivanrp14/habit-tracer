# Habit Tracer

App para seguir hábitos: crearlos, marcar el avance y ver estadísticas. El periodo de cada hábito puede ser diario, semanal o mensual.

Sustituye el README de plantilla de Expo. La app ya tiene pantallas y persistencia propias.

## Qué hay

- Pestañas en `app/(tabs)`: lista (`index`), alta (`create`) y estadísticas (`stats`).
- `context/HabitsContext.tsx`: estado de los hábitos (título, progreso, meta, unidad, periodo, color).
- `services/database.ts`: lectura y escritura local.
- Componentes `HabitCard`, `HabitList` y `ProgressBar`.
- `screens/HomeScreen.tsx` y un modal en `app/modal.tsx`.

## Stack

- Expo SDK 54 y Expo Router
- React Native y TypeScript
- Notificaciones, hápticos y compartición (`expo-notifications`, `expo-haptics`, `expo-sharing`)

## Cómo ejecutarlo

```bash
npm install
npx expo start
```

Otros scripts de `package.json`:

```bash
npm run android
npm run ios
npm run web
npm run lint
```

`npm run reset-project` ejecuta `scripts/reset-project.js` y deja el árbol como la plantilla de Expo. No lo uses si quieres conservar las pantallas de hábitos.
