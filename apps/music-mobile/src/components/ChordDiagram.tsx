import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Line, Circle, Rect, Text as SvgText } from "react-native-svg";
import { CHORD_DIAGRAMS } from "@/lib/chords";
import { colors, fonts, spacing } from "@/lib/theme";

interface Props {
  chord: string;
}

const W = 160;
const H = 140;
const STRING_GAP = 22;
const FRET_GAP = 22;
const LEFT = 28;
const TOP = 20;
const STRINGS = 6;
const FRETS = 5;

export function ChordDiagram({ chord }: Props) {
  const diagram = CHORD_DIAGRAMS[chord];

  if (!diagram) {
    return (
      <View style={styles.noData}>
        <Text style={styles.chordName}>{chord}</Text>
        <Text style={styles.noDataTxt}>No diagram available</Text>
      </View>
    );
  }

  const { frets, fingers, capo } = diagram;
  const validFrets = frets.filter((f) => f > 0);
  const minFret = validFrets.length ? Math.min(...validFrets) : 1;
  const displayMin = capo ?? (minFret > 1 ? minFret : 1);

  return (
    <View style={styles.root}>
      <Text style={styles.chordName}>{chord}</Text>

      <Svg width={W} height={H}>
        {/* Nut or fret label */}
        {displayMin <= 1 ? (
          <Rect x={LEFT} y={TOP - 4} width={(STRINGS - 1) * STRING_GAP} height={4} fill={colors.white} rx={1} />
        ) : (
          <SvgText x={LEFT - 8} y={TOP + FRET_GAP * 0.6} fontSize={10} fill={colors.muted} textAnchor="middle">
            {displayMin}fr
          </SvgText>
        )}

        {/* Vertical strings */}
        {Array.from({ length: STRINGS }).map((_, i) => (
          <Line
            key={i}
            x1={LEFT + i * STRING_GAP}
            y1={TOP}
            x2={LEFT + i * STRING_GAP}
            y2={TOP + FRETS * FRET_GAP}
            stroke={colors.border}
            strokeWidth={1}
          />
        ))}

        {/* Horizontal frets */}
        {Array.from({ length: FRETS + 1 }).map((_, i) => (
          <Line
            key={i}
            x1={LEFT}
            y1={TOP + i * FRET_GAP}
            x2={LEFT + (STRINGS - 1) * STRING_GAP}
            y2={TOP + i * FRET_GAP}
            stroke={colors.border}
            strokeWidth={1}
          />
        ))}

        {/* Dots */}
        {frets.map((fret, stringIdx) => {
          const x = LEFT + (STRINGS - 1 - stringIdx) * STRING_GAP;
          if (fret === -1) {
            return (
              <SvgText key={stringIdx} x={x} y={TOP - 6} fontSize={12} fill={colors.muted} textAnchor="middle">×</SvgText>
            );
          }
          if (fret === 0) {
            return (
              <Circle key={stringIdx} cx={x} cy={TOP - 8} r={5} fill="none" stroke={colors.muted} strokeWidth={1.5} />
            );
          }
          const y = TOP + (fret - displayMin + 0.5) * FRET_GAP;
          return (
            <Circle key={stringIdx} cx={x} cy={y} r={9} fill={colors.brand} />
          );
        })}

        {/* Finger numbers */}
        {fingers.map((finger, stringIdx) => {
          if (!finger) return null;
          const fret = frets[stringIdx];
          if (fret <= 0) return null;
          const x = LEFT + (STRINGS - 1 - stringIdx) * STRING_GAP;
          const y = TOP + (fret - displayMin + 0.5) * FRET_GAP;
          return (
            <SvgText key={stringIdx} x={x} y={y + 4} fontSize={9} fill={colors.white} textAnchor="middle">
              {finger}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: "center" },
  chordName: { color: colors.white, fontFamily: fonts.bold, fontSize: 18, marginBottom: spacing.sm },
  noData: { alignItems: "center", padding: spacing.lg },
  noDataTxt: { color: colors.muted, fontSize: 13, marginTop: spacing.sm },
});
