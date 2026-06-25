import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, spacing, radius, fonts, gradients, shadow } from "@/lib/theme";

interface Props {
  onSelect: (format: "gp5" | "pdf" | "txt") => void;
  onClose: () => void;
}

const FORMATS = [
  {
    id: "gp5" as const,
    label: "Guitar Pro 5",
    ext: ".gp5",
    icon: "🎸",
    desc: "Opens in Guitar Pro app",
    accent: "#10B981",
    accentBg: "rgba(16,185,129,0.15)",
  },
  {
    id: "pdf" as const,
    label: "PDF Chord Sheet",
    ext: ".pdf",
    icon: "📄",
    desc: "Print-ready chord chart",
    accent: "#EF4444",
    accentBg: "rgba(239,68,68,0.15)",
  },
  {
    id: "txt" as const,
    label: "Plain Text",
    ext: ".txt",
    icon: "📝",
    desc: "Simple text format",
    accent: "#0EA5E9",
    accentBg: "rgba(14,165,233,0.15)",
  },
];

export function DownloadSheet({ onSelect, onClose }: Props) {
  return (
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
        <View style={styles.handle} />
        <Text style={styles.title}>Export Format</Text>

        {FORMATS.map((fmt) => (
          <TouchableOpacity
            key={fmt.id}
            onPress={() => onSelect(fmt.id)}
            activeOpacity={0.8}
            style={shadow.subtle}
          >
            <LinearGradient
              colors={[fmt.accentBg, "rgba(139,92,246,0.08)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.row, { borderColor: fmt.accent + "40" }]}
            >
              <Text style={styles.icon}>{fmt.icon}</Text>
              <View style={styles.rowMeta}>
                <Text style={styles.rowLabel}>{fmt.label}</Text>
                <Text style={styles.rowDesc}>{fmt.desc}</Text>
              </View>
              <Text style={[styles.ext, { color: fmt.accent }]}>{fmt.ext}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.cancelBtn, shadow.subtle]}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["rgba(139,92,246,0.2)", "rgba(168,123,250,0.08)"]}
            style={styles.cancelBtnInner}
          >
            <Text style={styles.cancelTxt}>Cancel</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  title: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 18,
    textAlign: "center",
    marginBottom: spacing.lg,
    letterSpacing: -0.5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1.5,
    gap: spacing.md,
  },
  icon: { fontSize: 26 },
  rowMeta: { flex: 1 },
  rowLabel: { color: colors.white, fontFamily: fonts.bold, fontSize: 15 },
  rowDesc: { color: colors.muted, fontSize: 12, marginTop: 3 },
  ext: { fontSize: 13, fontFamily: fonts.bold },
  cancelBtn: {
    marginTop: spacing.md,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  cancelBtnInner: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.3)",
  },
  cancelTxt: { color: colors.brandLight, fontSize: 14, fontFamily: fonts.bold },
});
