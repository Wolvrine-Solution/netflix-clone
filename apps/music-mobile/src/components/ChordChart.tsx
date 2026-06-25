import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { ChordLine } from "@/types";
import { transposeChord } from "@/lib/chords";
import { colors, spacing, radius, fonts, gradients, shadow } from "@/lib/theme";
import { ChordDiagram } from "./ChordDiagram";

interface Props {
  lines: ChordLine[];
  transpose: number;
}

export function ChordChart({ lines, transpose }: Props) {
  const [selectedChord, setSelectedChord] = useState<string | null>(null);

  return (
    <View>
      {lines.map((line, i) => (
        <View key={i} style={styles.lineBlock}>
          {line.section && (
            <Text style={styles.section}>[{line.section}]</Text>
          )}

          {line.chords.length > 0 && (
            <View style={styles.chordRow}>
              {line.chords.map((cp, j) => {
                const chord = transposeChord(cp.chord, transpose);
                return (
                  <TouchableOpacity
                    key={j}
                    onPress={() => setSelectedChord(chord)}
                    activeOpacity={0.8}
                    style={shadow.subtle}
                  >
                    <LinearGradient
                      colors={["rgba(139,92,246,0.3)", "rgba(168,123,250,0.15)"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.chordTag}
                    >
                      <Text style={styles.chordTagTxt}>{chord}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <Text style={styles.lyric}>
            {line.lyrics || " "}
          </Text>
        </View>
      ))}

      {/* Chord diagram modal */}
      <Modal
        visible={!!selectedChord}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedChord(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedChord(null)}
        >
          <View style={styles.modalCard}>
            {selectedChord && (
              <ChordDiagram chord={selectedChord} />
            )}
            <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedChord(null)}>
              <Text style={styles.modalCloseTxt}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  lineBlock: { marginBottom: spacing.sm },
  section: {
    color: colors.brandLight,
    fontSize: 12,
    fontFamily: fonts.bold,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: "rgba(139,92,246,0.1)",
    borderLeftWidth: 2,
    borderLeftColor: colors.brand,
    borderRadius: 4,
  },
  chordRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 4,
  },
  chordTag: {
    borderWidth: 1.5,
    borderColor: "rgba(139,92,246,0.4)",
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chordTagTxt: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 13,
    letterSpacing: -0.3,
  },
  lyric: {
    color: "#D4D4D8",
    fontSize: 15,
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: "rgba(139,92,246,0.3)",
    width: 240,
    alignItems: "center",
    shadowColor: colors.brandGlow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  modalClose: {
    marginTop: spacing.lg,
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.brand,
    borderRadius: radius.lg,
    shadowColor: colors.brandGlow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 3,
  },
  modalCloseTxt: { color: colors.white, fontSize: 13, fontFamily: fonts.bold },
});
