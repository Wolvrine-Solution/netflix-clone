import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { colors, spacing, radius, fonts } from "@/lib/theme";

interface Props {
  transpose: number;
  capo: number;
  onTransposeChange: (v: number) => void;
  onCapoChange: (v: number) => void;
}

const CAPO_FRETS = [0, 1, 2, 3, 4, 5, 6, 7];

export function CapoTransposeBar({ transpose, capo, onTransposeChange, onCapoChange }: Props) {
  return (
    <View style={styles.container}>
      {/* Transpose */}
      <View style={styles.section}>
        <Text style={styles.label}>Transpose</Text>
        <View style={styles.stepper}>
          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => onTransposeChange(Math.max(-6, transpose - 1))}
          >
            <Text style={styles.stepTxt}>−</Text>
          </TouchableOpacity>
          <Text style={styles.stepVal}>
            {transpose > 0 ? `+${transpose}` : transpose}
          </Text>
          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => onTransposeChange(Math.min(6, transpose + 1))}
          >
            <Text style={styles.stepTxt}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Capo */}
      <View style={styles.section}>
        <Text style={styles.label}>Capo</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.capoRow}
        >
          {CAPO_FRETS.map((fret) => (
            <TouchableOpacity
              key={fret}
              style={[styles.capoBtn, capo === fret && styles.capoBtnActive]}
              onPress={() => onCapoChange(fret)}
            >
              <Text style={[styles.capoTxt, capo === fret && styles.capoTxtActive]}>
                {fret === 0 ? "Off" : fret}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  section: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  label: {
    color: colors.muted,
    fontSize: 11,
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.elevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  stepBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  stepTxt: { color: colors.brandLight, fontSize: 18, lineHeight: 20 },
  stepVal: {
    width: 32,
    textAlign: "center",
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
  capoRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  capoBtn: {
    width: 34,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  capoBtnActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  capoTxt: { color: colors.muted, fontSize: 12, fontFamily: fonts.bold },
  capoTxtActive: { color: colors.white },
});
