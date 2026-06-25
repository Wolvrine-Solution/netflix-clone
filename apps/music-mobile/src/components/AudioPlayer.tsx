import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, GestureResponderEvent } from "react-native";
import { Audio } from "expo-av";
import { colors, spacing, radius, fonts } from "@/lib/theme";

interface Props {
  uri: string;
}

interface PlaybackStatus {
  isPlaying: boolean;
  duration: number;
  position: number;
}

export function AudioPlayer({ uri }: Props) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [status, setStatus] = useState<PlaybackStatus>({
    isPlaying: false,
    duration: 0,
    position: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });

        const sound = new Audio.Sound();
        soundRef.current = sound;

        sound.setOnPlaybackStatusUpdate((s) => {
          if (s.isLoaded) {
            setStatus({
              isPlaying: s.isPlaying,
              duration: s.durationMillis ?? 0,
              position: s.positionMillis ?? 0,
            });
          }
        });

        await sound.loadAsync({ uri });
        const soundStatus = await sound.getStatusAsync();
        if (soundStatus.isLoaded) {
          setStatus({
            isPlaying: false,
            duration: soundStatus.durationMillis ?? 0,
            position: 0,
          });
        }
        setLoading(false);
      } catch (err: any) {
        setError(err?.message ?? "Failed to load audio");
        setLoading(false);
      }
    };

    loadAudio();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, [uri]);

  const togglePlay = async () => {
    if (!soundRef.current) return;
    try {
      if (status.isPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        await soundRef.current.playAsync();
      }
    } catch (err: any) {
      setError(err?.message ?? "Playback error");
    }
  };

  const handleSeek = async (e: GestureResponderEvent) => {
    if (!soundRef.current) return;
    const { width } = e.currentTarget.measure?.({ x: 0, y: 0, width: 0, height: 0 }) ?? { width: 0 };
    const x = e.nativeEvent.locationX || 0;
    const ratio = Math.max(0, Math.min(1, x / (width || 1)));
    const newPos = ratio * (status.duration || 0);
    try {
      await soundRef.current.setPositionAsync(newPos);
    } catch (err: any) {
      setError(err?.message ?? "Seek failed");
    }
  };

  const fmt = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };

  if (error) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorTxt}>{error}</Text>
      </View>
    );
  }

  const progress = status.duration ? status.position / status.duration : 0;

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.playBtn, loading && styles.playBtnDisabled]}
          onPress={togglePlay}
          disabled={loading}
        >
          <Text style={styles.playIcon}>{status.isPlaying ? "⏸" : "▶"}</Text>
        </TouchableOpacity>

        <Text style={styles.time}>
          {fmt(status.position)} / {fmt(status.duration)}
        </Text>
      </View>

      <View
        style={styles.seekContainer}
        onStartShouldSetResponder={() => true}
        onResponderMove={handleSeek}
        onResponderRelease={handleSeek}
      >
        <View style={styles.seekTrack}>
          <View style={[styles.seekFill, { width: `${progress * 100}%` }]} />
          <View
            style={[
              styles.seekThumb,
              { left: `${Math.max(0, Math.min(100, progress * 100)) - 4}%` },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.brandGlow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 5,
  },
  playBtnDisabled: { opacity: 0.45 },
  playIcon: { fontSize: 20 },
  time: { color: colors.muted, fontSize: 12, fontFamily: fonts.bold, flex: 1 },
  seekContainer: {
    height: 40,
    justifyContent: "center",
  },
  seekTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: "visible",
    justifyContent: "center",
  },
  seekFill: {
    height: 6,
    backgroundColor: colors.brand,
    borderRadius: radius.full,
    shadowColor: colors.brandGlow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  seekThumb: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: radius.full,
    backgroundColor: colors.brandLight,
    top: -5,
    shadowColor: colors.brandGlow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  error: { padding: spacing.md, backgroundColor: "rgba(239, 68, 68, 0.1)", borderRadius: radius.md },
  errorTxt: { color: "#EF4444", fontSize: 13 },
});
