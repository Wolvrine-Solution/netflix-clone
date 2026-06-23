import React, { useEffect, useRef, useState } from "react";
import { Audio, Permissions } from "expo-av";
import * as FileSystem from "expo-file-system";

interface AudioRecorderProps {
  onRecordingFinish: (uri: string) => void;
  onError?: (error: string) => void;
}

export interface RecorderState {
  isRecording: boolean;
  recordingDuration: number;
  recordingUri: string | null;
  error: string | null;
}

let globalRecording: Audio.Recording | null = null;

export const useAudioRecorder = ({ onRecordingFinish, onError }: AudioRecorderProps) => {
  const [state, setState] = useState<RecorderState>({
    isRecording: false,
    recordingDuration: 0,
    recordingUri: null,
    error: null,
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationRef = useRef(0);

  useEffect(() => {
    const requestAudioPermission = async () => {
      const perm = await Permissions.askAsync(Permissions.AUDIO);
      if (!perm.granted) {
        setState((s) => ({ ...s, error: "Microphone permission denied" }));
        onError?.("Microphone permission denied");
      }
    };
    requestAudioPermission();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (globalRecording) {
        globalRecording.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, [onError]);

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();

      globalRecording = recording;
      durationRef.current = 0;
      setState((s) => ({ ...s, isRecording: true, error: null }));

      timerRef.current = setInterval(() => {
        durationRef.current += 0.1;
        setState((s) => ({ ...s, recordingDuration: Math.floor(durationRef.current * 10) / 10 }));
      }, 100);
    } catch (err: any) {
      const errMsg = err?.message ?? "Failed to start recording";
      setState((s) => ({ ...s, error: errMsg }));
      onError?.(errMsg);
    }
  };

  const stopRecording = async (): Promise<string | null> => {
    if (!globalRecording) return null;

    try {
      if (timerRef.current) clearInterval(timerRef.current);
      await globalRecording.stopAndUnloadAsync();
      const uri = globalRecording.getURI();
      globalRecording = null;

      setState((s) => ({
        ...s,
        isRecording: false,
        recordingUri: uri,
        recordingDuration: durationRef.current,
      }));

      if (uri) onRecordingFinish(uri);
      return uri;
    } catch (err: any) {
      const errMsg = err?.message ?? "Failed to stop recording";
      setState((s) => ({ ...s, error: errMsg, isRecording: false }));
      onError?.(errMsg);
      return null;
    }
  };

  const cancelRecording = async () => {
    if (!globalRecording) return;

    try {
      if (timerRef.current) clearInterval(timerRef.current);
      await globalRecording.stopAndUnloadAsync();
      const uri = globalRecording.getURI();
      globalRecording = null;

      if (uri) {
        try {
          await FileSystem.deleteAsync(uri);
        } catch {}
      }

      durationRef.current = 0;
      setState({
        isRecording: false,
        recordingDuration: 0,
        recordingUri: null,
        error: null,
      });
    } catch (err: any) {
      const errMsg = err?.message ?? "Failed to cancel recording";
      setState((s) => ({ ...s, error: errMsg }));
      onError?.(errMsg);
    }
  };

  return {
    ...state,
    startRecording,
    stopRecording,
    cancelRecording,
  };
};
