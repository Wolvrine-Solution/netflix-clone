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
import { colors, spacing, radius, fonts, gradients, shadow } from "@/lib/theme";

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
      {/* Aurora background */}
      <LinearGradient
        colors={gradients.aurora}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 0.6 }}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing.lg },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <LinearGradient
              colors={gradients.brand}
              style={styles.logoBadge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.logoBadgeTxt}>🎸</Text>
            </LinearGradient>
            <Text style={styles.logo}>ChordGen</Text>
          </View>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.badge}>
            <Text style={styles.badgeTxt}>✦  AI chord detection</Text>
          </View>
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
          onPress={() => navigation.navigate("Recording")}
          activeOpacity={0.85}
          style={shadow.subtle}
        >
          <LinearGradient
            colors={gradients.brandSoft}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.recordCard}
          >
            <View style={styles.recordIconWrap}>
              <Text style={styles.recordIcon}>🎤</Text>
            </View>
            <View style={styles.recordMeta}>
              <Text style={styles.recordTitle}>Record Audio</Text>
              <Text style={styles.recordDesc}>Capture & analyze in real-time</Text>
            </View>
            <Text style={styles.recordArrow}>›</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Mode toggle */}
        <View style={styles.modeRow}>
          {(["url", "file"] as const).map((m) => {
            const active = mode === m;
            const label = m === "url" ? "🔗  Song URL" : "📁  Upload File";
            return active ? (
              <LinearGradient
                key={m}
                colors={gradients.brand}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modeBtnActive}
              >
                <TouchableOpacity
                  style={styles.modeBtnInner}
                  onPress={() => setMode(m)}
                  activeOpacity={0.9}
                >
                  <Text style={styles.modeTxtActive}>{label}</Text>
                </TouchableOpacity>
              </LinearGradient>
            ) : (
              <TouchableOpacity
                key={m}
                style={styles.modeBtn}
                onPress={() => setMode(m)}
                activeOpacity={0.7}
              >
                <Text style={styles.modeTxt}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Input */}
        {mode === "url" ? (
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="https://youtube.com/watch?v=..."
              placeholderTextColor={colors.mutedDark}
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
          <TouchableOpacity
            style={styles.uploadBox}
            onPress={handleFilePick}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.uploadIcon}>📂</Text>
            <Text style={styles.uploadLabel}>Tap to pick a file</Text>
            <Text style={styles.uploadSub}>MP3, WAV, FLAC, M4A — max 50MB</Text>
          </TouchableOpacity>
        )}

        {/* Submit */}
        {mode === "url" && (
          <TouchableOpacity
            onPress={handleUrl}
            disabled={!url.trim() || loading}
            activeOpacity={0.9}
            style={[
              shadow.glow,
              (!url.trim() || loading) && styles.ctaDisabled,
            ]}
          >
            <LinearGradient
              colors={gradients.brand}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cta}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.ctaTxt}>Generate Chord Chart  →</Text>
              )}
            </LinearGradient>
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
                onPress={() =>
                  navigation.navigate("Results", { jobId: job.jobId })
                }
                activeOpacity={0.7}
              >
                <View style={styles.recentThumb}>
                  <Text style={styles.recentThumbTxt}>♪</Text>
                </View>
                <View style={styles.recentMeta}>
                  <Text style={styles.recentTitle} numberOfLines={1}>
                    {job.title ?? "Unknown Song"}
                  </Text>
                  <Text style={styles.recentArtist} numberOfLines={1}>
                    {job.artist ?? "Unknown Artist"}
                  </Text>
                </View>
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
  header: { marginBottom: spacing.xl },
  logoRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  logoBadgeTxt: { fontSize: 18 },
  logo: {
    fontSize: 20,
    color: colors.white,
    fontFamily: fonts.bold,
    letterSpacing: -0.5,
  },
  hero: { marginBottom: spacing.xl },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: spacing.md,
  },
  badgeTxt: { color: colors.accent, fontSize: 11, fontFamily: fonts.bold },
  heroTitle: {
    fontSize: 34,
    color: colors.white,
    fontFamily: fonts.bold,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  heroAccent: { color: colors.brandLight },
  heroDesc: {
    fontSize: 15,
    color: colors.muted,
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  heroHighlight: { color: colors.white },
  recordCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.25)",
    padding: spacing.md,
    marginBottom: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  recordIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: "rgba(139,92,246,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  recordIcon: { fontSize: 26 },
  recordMeta: { flex: 1 },
  recordTitle: { color: colors.white, fontFamily: fonts.bold, fontSize: 15 },
  recordDesc: { color: colors.muted, fontSize: 12, marginTop: 2 },
  recordArrow: { color: colors.brandLight, fontSize: 22 },
  modeRow: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 5,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    gap: 5,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: radius.md,
    alignItems: "center",
  },
  modeBtnActive: {
    flex: 1,
    borderRadius: radius.md,
  },
  modeBtnInner: {
    paddingVertical: 11,
    alignItems: "center",
  },
  modeTxt: { color: colors.muted, fontSize: 14 },
  modeTxtActive: { color: colors.white, fontFamily: fonts.bold, fontSize: 14 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
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
  uploadLabel: { color: colors.white, fontSize: 15, fontFamily: fonts.bold },
  uploadSub: { color: colors.muted, fontSize: 12, marginTop: 4 },
  cta: {
    borderRadius: radius.md,
    paddingVertical: 17,
    alignItems: "center",
  },
  ctaDisabled: { opacity: 0.45 },
  ctaTxt: { color: colors.white, fontFamily: fonts.bold, fontSize: 16 },
  uploadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
    marginVertical: spacing.sm,
  },
  uploadingTxt: { color: colors.brandLight, fontSize: 14 },
  sourcesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: spacing.lg,
  },
  sourceChip: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.full,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  sourceChipTxt: { color: colors.muted, fontSize: 12 },
  section: { marginTop: spacing.xl },
  sectionTitle: {
    color: colors.muted,
    fontSize: 11,
    fontFamily: fonts.bold,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  recentItem: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  recentThumb: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: "rgba(139,92,246,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  recentThumbTxt: { color: colors.brandLight, fontSize: 18 },
  recentMeta: { flex: 1, minWidth: 0 },
  recentTitle: { color: colors.white, fontSize: 14, fontFamily: fonts.bold },
  recentArtist: { color: colors.muted, fontSize: 12, marginTop: 2 },
  recentArrow: { color: colors.muted, fontSize: 20 },
});
