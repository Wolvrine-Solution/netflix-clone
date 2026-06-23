import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList, SongResult } from "@/types";
import { getStatus, getResults, downloadFile } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { colors, spacing, radius, fonts } from "@/lib/theme";
import { ChordChart } from "@/components/ChordChart";
import { ProcessingProgress } from "@/components/ProcessingProgress";
import { DownloadSheet } from "@/components/DownloadSheet";
import { CapoTransposeBar } from "@/components/CapoTransposeBar";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Results">;
  route: RouteProp<RootStackParamList, "Results">;
};

const POLL_MS = 1800;

export function ResultsScreen({ navigation, route }: Props) {
  const { jobId } = route.params;
  const insets = useSafeAreaInsets();
  const addRecentJob = useAppStore((s) => s.addRecentJob);

  const [status, setStatus] = useState("queued");
  const [progress, setProgress] = useState(0);
  const [data, setData] = useState<SongResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transpose, setTranspose] = useState(0);
  const [capo, setCapo] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [showDownload, setShowDownload] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let alive = true;

    const poll = async () => {
      try {
        const job = await getStatus(jobId);
        if (!alive) return;
        setStatus(job.status);
        setProgress(job.progress ?? 0);

        if (job.status === "completed") {
          const result = await getResults(jobId);
          setData(result);
          addRecentJob(jobId, {
            title: result.meta.title,
            artist: result.meta.artist,
          });
        } else if (job.status === "failed") {
          setError(job.error ?? "Processing failed");
        } else {
          timer = setTimeout(poll, POLL_MS);
        }
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Network error");
      }
    };

    poll();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [jobId]);

  const handleDownload = useCallback(
    async (format: "gp5" | "pdf" | "txt") => {
      setDownloading(true);
      setShowDownload(false);
      try {
        const extMap = { gp5: ".gp5", pdf: ".pdf", txt: ".txt" };
        const name = `${data?.meta.title ?? "chords"}${extMap[format]}`;
        const dest = FileSystem.cacheDirectory + name;
        const uri = await downloadFile(jobId, format, dest);
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, { mimeType: format === "pdf" ? "application/pdf" : "application/octet-stream" });
        } else {
          Alert.alert("Downloaded", `Saved to cache: ${name}`);
        }
      } catch (e: any) {
        Alert.alert("Download failed", e?.message ?? "Unknown error");
      } finally {
        setDownloading(false);
      }
    },
    [jobId, data]
  );

  const effectiveTranspose = transpose - capo;

  if (error) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnTxt}>← Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.navBack}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.navBackTxt}>✕</Text>
        </TouchableOpacity>
        <ProcessingProgress status={status} progress={progress} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnTxt}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.metaCenter}>
          <Text style={styles.songTitle} numberOfLines={1}>
            {data.meta.title ?? "Chord Chart"}
          </Text>
          <Text style={styles.songArtist} numberOfLines={1}>
            {data.meta.artist}
            {data.meta.key ? ` · ${data.meta.key}` : ""}
            {data.meta.bpm ? ` · ${data.meta.bpm} BPM` : ""}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.downloadBtn}
          onPress={() => setShowDownload(true)}
          disabled={downloading}
        >
          <Text style={styles.downloadBtnTxt}>{downloading ? "…" : "⬇"}</Text>
        </TouchableOpacity>
      </View>

      {/* Transpose + capo */}
      <CapoTransposeBar
        transpose={transpose}
        capo={capo}
        onTransposeChange={setTranspose}
        onCapoChange={setCapo}
      />

      {/* Chord chart */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ChordChart lines={data.lines} transpose={effectiveTranspose} />
      </ScrollView>

      {/* Download sheet */}
      {showDownload && (
        <DownloadSheet
          onSelect={handleDownload}
          onClose={() => setShowDownload(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  navBack: { position: "absolute", top: spacing.md, right: spacing.md, zIndex: 10, padding: spacing.sm },
  navBackTxt: { color: colors.muted, fontSize: 18 },
  backBtn: { paddingVertical: 6, paddingRight: spacing.sm },
  backBtnTxt: { color: colors.brandLight, fontSize: 14 },
  metaCenter: { flex: 1, marginHorizontal: spacing.sm },
  songTitle: { color: colors.white, fontFamily: fonts.bold, fontSize: 15 },
  songArtist: { color: colors.muted, fontSize: 12, marginTop: 2 },
  downloadBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  downloadBtnTxt: { color: colors.white, fontSize: 18 },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xxl },
  errorText: { color: colors.red, fontSize: 15, textAlign: "center", marginBottom: spacing.lg },
});
