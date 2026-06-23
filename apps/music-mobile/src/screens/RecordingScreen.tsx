import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/types";
import { colors, spacing, radius, fonts } from "@/lib/theme";
import { useAudioRecorder } from "@/components/AudioRecorder";
import { AudioPlayer } from "@/components/AudioPlayer";
import { submitFile } from "@/lib/api";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Recording">;
};

export function RecordingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [submitting, setSubmitting] = useState(false);

  const {
    isRecording,
    recordingDuration,
    recordingUri,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useAudioRecorder({
    onRecordingFinish: (uri) => {
      console.log("Recording saved:", uri);
    },
    onError: (err) => {
      Alert.alert("Recording Error", err);
    },
  });

  const handleStart = async () => {
    await startRecording();
  };

  const handleStop = async () => {
    await stopRecording();
  };

  const handleCancel = async () => {
    await cancelRecording();
  };

  const handleSubmit = async () => {
    if (!recordingUri) {
      Alert.alert("Error", "No recording available");
      return;
    }

    setSubmitting(true);
    try {
      const jobId = await submitFile(recordingUri, "audio/wav");
      navigation.reset({
        index: 1,
        routes: [
          { name: "Home" },
          { name: "Results", params: { jobId } },
        ],
      });
    } catch (err: any) {
      Alert.alert("Upload failed", err?.message ?? "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${min}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backTxt}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Record Audio</Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.content}>
        {/* Recording State */}
        {isRecording && (
          <View style={styles.recordingCard}>
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingTxt}>Recording...</Text>
            </View>
            <Text style={styles.durationDisplay}>{fmt(recordingDuration)}</Text>
          </View>
        )}

        {/* Playback State */}
        {!isRecording && recordingUri && (
          <View style={styles.playbackCard}>
            <Text style={styles.playbackTitle}>Preview</Text>
            <AudioPlayer uri={recordingUri} />
            <Text style={styles.durationHint}>Duration: {fmt(recordingDuration)}</Text>
          </View>
        )}

        {/* Error State */}
        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTxt}>{error}</Text>
          </View>
        )}

        {/* Idle State */}
        {!isRecording && !recordingUri && (
          <View style={styles.idleCard}>
            <Text style={styles.idleIcon}>🎤</Text>
            <Text style={styles.idleTxt}>Ready to record</Text>
            <Text style={styles.idleSubtxt}>Tap below to start</Text>
          </View>
        )}

        {/* Recording Mode Note */}
        <View style={styles.modeCard}>
          <Text style={styles.modeTxt}>🎤 Live Microphone</Text>
          <Text style={styles.modeNote}>🔊 System audio recording coming soon</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={[styles.footer, { paddingBottom: insets.bottom || spacing.lg }]}>
        {isRecording ? (
          <View style={styles.recordingActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelBtnTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.stopBtn} onPress={handleStop}>
              <Text style={styles.stopBtnTxt}>Stop</Text>
            </TouchableOpacity>
          </View>
        ) : recordingUri ? (
          <View style={styles.reviewActions}>
            <TouchableOpacity
              style={styles.rerecordBtn}
              onPress={handleCancel}
              disabled={submitting}
            >
              <Text style={styles.rerecordBtnTxt}>Re-record</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitBtnTxt}>Submit</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.startBtn, error && styles.startBtnDisabled]}
            onPress={handleStart}
            disabled={!!error}
          >
            <Text style={styles.startBtnTxt}>Start Recording</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backTxt: { color: colors.brandLight, fontSize: 14 },
  title: { color: colors.white, fontFamily: fonts.bold, fontSize: 16 },
  spacer: { width: 60 },
  content: { flex: 1, padding: spacing.lg, gap: spacing.lg },
  recordingCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "#EF4444",
    alignItems: "center",
    gap: spacing.md,
  },
  recordingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#EF4444",
    animation: "blink",
  },
  recordingTxt: { color: "#EF4444", fontFamily: fonts.bold, fontSize: 14 },
  durationDisplay: {
    color: colors.white,
    fontSize: 32,
    fontFamily: fonts.bold,
    fontVariant: ["tabular-nums"],
  },
  playbackCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  playbackTitle: { color: colors.white, fontFamily: fonts.bold, fontSize: 14 },
  durationHint: { color: colors.muted, fontSize: 12, textAlign: "center" },
  errorCard: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "#EF4444",
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorTxt: { color: "#EF4444", fontSize: 13 },
  idleCard: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  idleIcon: { fontSize: 48 },
  idleTxt: { color: colors.white, fontFamily: fonts.bold, fontSize: 16 },
  idleSubtxt: { color: colors.muted, fontSize: 13 },
  modeCard: {
    backgroundColor: colors.elevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  modeTxt: { color: colors.white, fontSize: 13, fontFamily: fonts.bold },
  modeNote: { color: colors.muted, fontSize: 12 },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  recordingActions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  cancelBtnTxt: { color: colors.muted, fontFamily: fonts.bold, fontSize: 14 },
  stopBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: "#EF4444",
    alignItems: "center",
  },
  stopBtnTxt: { color: colors.white, fontFamily: fonts.bold, fontSize: 14 },
  reviewActions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  rerecordBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  rerecordBtnTxt: { color: colors.muted, fontFamily: fonts.bold, fontSize: 14 },
  submitBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.brand,
    alignItems: "center",
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnTxt: { color: colors.white, fontFamily: fonts.bold, fontSize: 14 },
  startBtn: {
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.brand,
    alignItems: "center",
  },
  startBtnDisabled: { opacity: 0.5 },
  startBtnTxt: { color: colors.white, fontFamily: fonts.bold, fontSize: 14 },
});
