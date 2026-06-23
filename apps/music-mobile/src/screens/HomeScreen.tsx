import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/types";
import { submitUrl, submitFile } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { colors, spacing, radius, fonts } from "@/lib/theme";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Home">;
};

const SOURCES = ["YouTube", "SoundCloud", "Bandcamp", "MP3 / WAV", "Upload"];

export function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const recentJobs = useAppStore((s) => s.recentJobs);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"url" | "file">("url");

  const handleUrl = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const jobId = await submitUrl(url.trim());
      navigation.navigate("Results", { jobId });
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to process URL");
    } finally {
      setLoading(false);
    }
  };

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["audio/*", "video/mp4"],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const file = result.assets[0];
      setLoading(true);
      const jobId = await submitFile(file.uri, file.mimeType ?? "audio/mpeg");
      navigation.navigate("Results", { jobId });
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to upload file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <LinearGradient
        colors={["rgba(124,58,237,0.18)", "#0F0F13"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 0.5 }}
      />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.lg }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🎸 ChordGen</Text>
          <Text style={styles.subtitle}>AI Chord Chart & Guitar Pro Generator</Text>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>
            Paste a song link.{"\n"}
            <Text style={styles.heroAccent}>Get chords instantly.</Text>
          </Text>
          <Text style={styles.heroDesc}>
            AI detects chords, aligns to lyrics, and exports a{" "}
            <Text style={styles.heroHighlight}>Guitar Pro file</Text>.
          </Text>
        </View>

        {/* Record Audio Card */}
        <TouchableOpacity
          style={styles.recordCard}
          onPress={() => navigation.navigate("Recording")}
          activeOpacity={0.7}
        >
          <Text style={styles.recordIcon}>🎤</Text>
          <View style={styles.recordMeta}>
            <Text style={styles.recordTitle}>Record Audio</Text>
            <Text style={styles.recordDesc}>Record and analyze in real-time</Text>
          </View>
          <Text style={styles.recordArrow}>›</Text>
        </TouchableOpacity>

        {/* Mode toggle */}
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === "url" && styles.modeBtnActive]}
            onPress={() => setMode("url")}
          >
            <Text style={[styles.modeTxt, mode === "url" && styles.modeTxtActive]}>
              🔗 Song URL
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === "file" && styles.modeBtnActive]}
            onPress={() => setMode("file")}
          >
            <Text style={[styles.modeTxt, mode === "file" && styles.modeTxtActive]}>
              📁 Upload File
            </Text>
          </TouchableOpacity>
        </View>

        {/* Input */}
        {mode === "url" ? (
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="https://youtube.com/watch?v=..."
              placeholderTextColor={colors.muted}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="go"
              onSubmitEditing={handleUrl}
            />
            {url.length > 0 && (
              <TouchableOpacity style={styles.clearBtn} onPress={() => setUrl("")}>
                <Text style={styles.clearTxt}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <TouchableOpacity style={styles.uploadBox} onPress={handleFilePick} disabled={loading}>
            <Text style={styles.uploadIcon}>📂</Text>
            <Text style={styles.uploadLabel}>Tap to pick a file</Text>
            <Text style={styles.uploadSub}>MP3, WAV, FLAC, M4A — max 50MB</Text>
          </TouchableOpacity>
        )}

        {/* Submit */}
        {mode === "url" && (
          <TouchableOpacity
            style={[styles.cta, (!url.trim() || loading) && styles.ctaDisabled]}
            onPress={handleUrl}
            disabled={!url.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.ctaTxt}>Generate Chord Chart</Text>
            )}
          </TouchableOpacity>
        )}

        {loading && mode === "file" && (
          <View style={styles.uploadingRow}>
            <ActivityIndicator color={colors.brandLight} />
            <Text style={styles.uploadingTxt}>Uploading...</Text>
          </View>
        )}

        {/* Supported sources */}
        <View style={styles.sourcesRow}>
          {SOURCES.map((s) => (
            <View key={s} style={styles.sourceChip}>
              <Text style={styles.sourceChipTxt}>{s}</Text>
            </View>
          ))}
        </View>

        {/* Recent */}
        {recentJobs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent</Text>
            {recentJobs.slice(0, 5).map((job) => (
              <TouchableOpacity
                key={job.jobId}
                style={styles.recentItem}
                onPress={() => navigation.navigate("Results", { jobId: job.jobId })}
              >
                <Text style={styles.recentTitle} numberOfLines={1}>
                  {job.title ?? "Unknown Song"}
                </Text>
                <Text style={styles.recentArtist} numberOfLines={1}>
                  {job.artist ?? "Unknown Artist"}
                </Text>
                <Text style={styles.recentArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  header: { alignItems: "center", marginBottom: spacing.xl },
  logo: { fontSize: 24, color: colors.white, fontFamily: fonts.bold, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: colors.muted, marginTop: 4 },
  hero: { marginBottom: spacing.xl },
  heroTitle: { fontSize: 30, color: colors.white, fontFamily: fonts.bold, lineHeight: 38 },
  heroAccent: { color: colors.brandLight },
  heroDesc: { fontSize: 15, color: colors.muted, marginTop: spacing.sm, lineHeight: 22 },
  heroHighlight: { color: colors.white },
  recordCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  recordIcon: { fontSize: 32 },
  recordMeta: { flex: 1 },
  recordTitle: { color: colors.white, fontFamily: fonts.bold, fontSize: 14 },
  recordDesc: { color: colors.muted, fontSize: 12, marginTop: 2 },
  recordArrow: { color: colors.muted, fontSize: 18 },
  modeRow: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 4,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.md, alignItems: "center" },
  modeBtnActive: { backgroundColor: colors.brand },
  modeTxt: { color: colors.muted, fontSize: 14 },
  modeTxtActive: { color: colors.white, fontFamily: fonts.bold },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  input: { flex: 1, color: colors.white, fontSize: 14, paddingVertical: 16 },
  clearBtn: { padding: 6 },
  clearTxt: { color: colors.muted, fontSize: 14 },
  uploadBox: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    paddingVertical: spacing.xl,
    marginBottom: spacing.md,
  },
  uploadIcon: { fontSize: 32, marginBottom: spacing.sm },
  uploadLabel: { color: colors.white, fontSize: 15 },
  uploadSub: { color: colors.muted, fontSize: 12, marginTop: 4 },
  cta: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaDisabled: { opacity: 0.5 },
  ctaTxt: { color: colors.white, fontFamily: fonts.bold, fontSize: 16 },
  uploadingRow: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center", marginVertical: spacing.sm },
  uploadingTxt: { color: colors.brandLight, fontSize: 14 },
  sourcesRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: spacing.lg },
  sourceChip: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sourceChipTxt: { color: colors.muted, fontSize: 12 },
  section: { marginTop: spacing.xl },
  sectionTitle: { color: colors.muted, fontSize: 11, fontFamily: fonts.bold, letterSpacing: 1, textTransform: "uppercase", marginBottom: spacing.sm },
  recentItem: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
  },
  recentTitle: { flex: 1, color: colors.white, fontSize: 14 },
  recentArtist: { color: colors.muted, fontSize: 12, marginRight: spacing.sm },
  recentArrow: { color: colors.muted, fontSize: 18 },
});
