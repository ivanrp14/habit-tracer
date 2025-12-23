import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

type ProgressBarProps = { progress: number };

export default function ProgressBar({ progress }: ProgressBarProps) {
  const progressValue = useSharedValue(progress);

  progressValue.value = withTiming(progress, { duration: 500 });

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
  }));

  return (
    <View style={styles.background}>
      <Animated.View style={[styles.fill, animatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    marginTop: 12,
    height: 10,
    width: "100%",
    backgroundColor: "#334155",
    borderRadius: 10,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: "#38bdf8",
    borderRadius: 10,
  },
});
