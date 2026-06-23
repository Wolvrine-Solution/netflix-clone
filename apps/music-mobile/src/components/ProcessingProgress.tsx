import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { colors, spacing, radius, fonts } from "@/lib/theme";

const STEPS = [
  { key: "queued",     label: "Waiting in queue...",          pct: 5  },
  { key: "extracting",label: "Extracting audio...",           pct: 20 },
  { key: "analyzing", label: "Detecting chords...",           pct: 50 },
  { key: "lyrics",    label: "Fetching lyrics...",            pct: 70 },
  { key: "aligning",  label: "Aligning chords to lyrics...", pct: 85 },
  { key: "exporting", label: "Generating Guitar Pro file...",pct: 95  },
];

interface Props {
  status: string;
  progress: number;
}

export function ProcessingProgress({ status, progress }: Props) {
  const step = STEPS.find((s) => s.key === status) ?? { label: "Processing...", pct: progress };
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: step.pct / 100,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [step.pct]);

  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  return (
    <View style={styles.card}>
      <Text style={styles.emoji}>🎵</Text>
      <Text style={styles.label}>{step.label}</Text>

      {/* Progress bar */}
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width }]} />
      </View>
      <Text style={styles.pct}>{step.pct}%</Text>

      {/* Step list */}
      <View style={styles.steps}>
        {STEPS.map((s) => {
          const done = step.pct > s.pct;
          const active = status === s.key;
          return (
            <View key={s.key} style={styles.stepRow}>
              <View style={[
                styles.dot,
                done && styles.dotDone,
                active && styles.dotActive,
              ]} />
              <Text style={[
                styles.stepTxt,
                done && styles.stepDone,
                active && styles.stepActive,
              ]}>
                {s.label}
              </Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.hint}>Usually 30–60 seconds</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
  },
  emoji: { fontSize: 36, marginBottom: spacing.md },
  label: { color: colors.white, fontSize: 16, fontFamily: fonts.bold, marginBottom: spacing.lg, textAlign: "center" },
  track: {
    width: "100%",
    height: 6,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: "hidden",
    marginBottom: 6,
  },
  fill: {
    height: "100%",
    backgroundColor: colors.brand,
    borderRadius: radius.full,
  },
  pct: { color: colors.muted, fontSize: 12, marginBottom: spacing.lg },
  steps: { width: "100%", gap: 8 },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: "transparent",
  },
  dotDone: { backgroundColor: colors.brand, borderColor: colors.brand },
  dotActive: { borderColor: colors.white },
  stepTxt: { color: colors.muted, fontSize: 13 },
  stepDone: { color: colors.brandLight },
  stepActive: { color: colors.white },
  hint: { color: colors.muted, fontSize: 11, marginTop: spacing.lg },
});
