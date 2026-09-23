# Habit Tracer

An app for tracking habits: create them, mark progress, and see stats. Each habit's period can be daily, weekly, or monthly.

This replaces the Expo template README. The app already has its own screens and persistence.

## What's here

- Tabs in `app/(tabs)`: list (`index`), create (`create`), and stats (`stats`).
- `context/HabitsContext.tsx`: habit state (title, progress, goal, unit, period, color).
- `services/database.ts`: local read and write.
- `HabitCard`, `HabitList`, and `ProgressBar` components.
- `screens/HomeScreen.tsx` and a modal in `app/modal.tsx`.

## Stack

- Expo SDK 54 and Expo Router
- React Native and TypeScript
- Notifications, haptics, and sharing (`expo-notifications`, `expo-haptics`, `expo-sharing`)

## How to run

```bash
npm install
npx expo start
```

Other scripts from `package.json`:

```bash
npm run android
npm run ios
npm run web
npm run lint
```

`npm run reset-project` runs `scripts/reset-project.js` and resets the tree to the Expo template. Do not use it if you want to keep the habit screens.
