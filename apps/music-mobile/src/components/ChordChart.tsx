import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import type { ChordLine } from "@/types";
import { transposeChord } from "@/lib/chords";
import { colors, spacing, radius, fonts } from "@/lib/theme";
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
                    style={styles.chordTag}
                    onPress={() => setSelectedChord(chord)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.chordTagTxt}>{chord}</Text>
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
    fontSize: 11,
    fontFamily: fonts.bold,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: spacing.lg,
    marginBottom: 4,
  },
  chordRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 4,
  },
  chordTag: {
    backgroundColor: "rgba(124,58,237,0.2)",
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.4)",
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chordTagTxt: {
    color: colors.brandLight,
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  lyric: {
    color: "#D4D4D8",
    fontSize: 15,
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    width: 220,
    alignItems: "center",
  },
  modalClose: {
    marginTop: spacing.md,
    paddingVertical: 8,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.elevated,
    borderRadius: radius.full,
  },
  modalCloseTxt: { color: colors.muted, fontSize: 13 },
});
