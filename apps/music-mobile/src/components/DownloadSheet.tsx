import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from "react-native";
import { colors, spacing, radius, fonts } from "@/lib/theme";

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
  },
  {
    id: "pdf" as const,
    label: "PDF Chord Sheet",
    ext: ".pdf",
    icon: "📄",
    desc: "Print-ready chord chart",
  },
  {
    id: "txt" as const,
    label: "Plain Text",
    ext: ".txt",
    icon: "📝",
    desc: "Simple text format",
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
            style={styles.row}
            onPress={() => onSelect(fmt.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.icon}>{fmt.icon}</Text>
            <View style={styles.rowMeta}>
              <Text style={styles.rowLabel}>{fmt.label}</Text>
              <Text style={styles.rowDesc}>{fmt.desc}</Text>
            </View>
            <Text style={styles.ext}>{fmt.ext}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelTxt}>Cancel</Text>
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
    fontSize: 16,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.elevated,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  icon: { fontSize: 24 },
  rowMeta: { flex: 1 },
  rowLabel: { color: colors.white, fontFamily: fonts.bold, fontSize: 14 },
  rowDesc: { color: colors.muted, fontSize: 12, marginTop: 2 },
  ext: { color: colors.brandLight, fontSize: 12, fontFamily: fonts.bold },
  cancelBtn: {
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelTxt: { color: colors.muted, fontSize: 14 },
});
