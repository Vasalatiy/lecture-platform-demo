import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useCreateVideo, useRequestUploadUrl } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import * as Haptics from "expo-haptics";

const MAX_SIZE_MB = 500;

type PickedFile = { uri: string; name: string; size: number; type: string };

async function pickVideoFile(): Promise<PickedFile | null> {
  return new Promise((resolve) => {
    if (Platform.OS !== "web") {
      resolve(null);
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm";
    input.onchange = (e: Event) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (!f) { resolve(null); return; }
      resolve({ uri: URL.createObjectURL(f), name: f.name, size: f.size, type: f.type || "video/mp4" });
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}

export default function UploadScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lecturer, setLecturer] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [file, setFile] = useState<PickedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");

  const createVideo = useCreateVideo();
  const requestUploadUrl = useRequestUploadUrl();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handlePickFile = async () => {
    if (Platform.OS !== "web") {
      Alert.alert("Web Only", "Video upload is available in the web browser.");
      return;
    }
    const picked = await pickVideoFile();
    if (!picked) return;
    if (picked.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File too large. Max ${MAX_SIZE_MB}MB.`);
      return;
    }
    setFile(picked);
    setError("");
  };

  const handleUpload = async () => {
    if (!file || !title || !lecturer || !category) {
      setError("Please fill in all required fields and select a video.");
      return;
    }

    setError("");
    setUploading(true);
    setUploadProgress(10);

    try {
      const { uploadURL, objectPath } = await requestUploadUrl.mutateAsync({
        data: { name: file.name, size: file.size, contentType: file.type },
      });

      setUploadProgress(30);

      const blob = await fetch(file.uri).then((r) => r.blob());
      await fetch(uploadURL, {
        method: "PUT",
        body: blob,
        headers: { "Content-Type": file.type },
      });

      setUploadProgress(70);

      await createVideo.mutateAsync({
        data: { title, description, lecturer, category, videoUrl: objectPath, status },
      });

      setUploadProgress(100);
      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Success", "Lecture uploaded successfully!");
      } else {
        alert("Lecture uploaded successfully!");
      }
      router.back();
    } catch (err: any) {
      setError(err.message ?? "Upload failed. Please try again.");
      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setUploading(false);
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingTop: topPad + 16,
      paddingHorizontal: 20,
      paddingBottom: 16,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: { fontSize: 18, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold" },
    scroll: { padding: 20, paddingBottom: bottomPad + 40 },
    label: { fontSize: 14, fontWeight: "600", color: colors.foreground, fontFamily: "Inter_600SemiBold", marginBottom: 8, marginTop: 16 },
    required: { color: colors.destructive },
    input: {
      height: 48,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: colors.radius,
      paddingHorizontal: 14,
      fontSize: 15,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
      backgroundColor: colors.card,
    },
    textArea: {
      height: 96,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: colors.radius,
      paddingHorizontal: 14,
      paddingTop: 12,
      fontSize: 15,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
      backgroundColor: colors.card,
      textAlignVertical: "top",
    },
    filePicker: {
      height: 80,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: colors.radius,
      borderStyle: "dashed",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.muted,
      gap: 6,
    },
    filePickerActive: { borderColor: colors.primary, backgroundColor: "#EFF6FF" },
    filePickerText: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    filePickerSub: { fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    statusRow: { flexDirection: "row", gap: 10, marginTop: 8 },
    statusBtn: { flex: 1, height: 44, borderWidth: 1.5, borderRadius: colors.radius, justifyContent: "center", alignItems: "center" },
    statusBtnText: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
    error: { fontSize: 13, color: colors.destructive, fontFamily: "Inter_400Regular", marginTop: 8 },
    uploadBtn: {
      height: 52,
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 24,
    },
    uploadBtnDisabled: { opacity: 0.5 },
    uploadBtnText: { fontSize: 16, fontWeight: "600", color: "#fff", fontFamily: "Inter_600SemiBold" },
    progressBar: { height: 4, backgroundColor: colors.muted, borderRadius: 2, marginTop: 12, overflow: "hidden" },
    progressFill: { height: "100%", backgroundColor: colors.primary, borderRadius: 2 },
  });

  const canSubmit = !!file && !!title && !!lecturer && !!category && !uploading;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>Upload Lecture</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Video File <Text style={styles.required}>*</Text></Text>
        <Pressable style={[styles.filePicker, file && styles.filePickerActive]} onPress={handlePickFile}>
          <Feather name={file ? "check-circle" : "upload-cloud"} size={24} color={file ? colors.success : colors.mutedForeground} />
          <Text style={styles.filePickerText}>{file ? file.name : "Click to select video file"}</Text>
          <Text style={styles.filePickerSub}>{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : "MP4, MOV, WebM · max 500MB · web browser only"}</Text>
        </Pressable>

        <Text style={styles.label}>Title <Text style={styles.required}>*</Text></Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Lecture title" placeholderTextColor={colors.mutedForeground} />

        <Text style={styles.label}>Description</Text>
        <TextInput style={styles.textArea} value={description} onChangeText={setDescription} placeholder="Brief description" placeholderTextColor={colors.mutedForeground} multiline numberOfLines={4} />

        <Text style={styles.label}>Lecturer <Text style={styles.required}>*</Text></Text>
        <TextInput style={styles.input} value={lecturer} onChangeText={setLecturer} placeholder="Lecturer name" placeholderTextColor={colors.mutedForeground} />

        <Text style={styles.label}>Course / Category <Text style={styles.required}>*</Text></Text>
        <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="e.g. Physics, History" placeholderTextColor={colors.mutedForeground} />

        <Text style={styles.label}>Publication Status</Text>
        <View style={styles.statusRow}>
          {(["draft", "published"] as const).map((s) => (
            <Pressable
              key={s}
              style={[styles.statusBtn, status === s ? { borderColor: colors.primary, backgroundColor: "#EFF6FF" } : { borderColor: colors.border }]}
              onPress={() => setStatus(s)}
            >
              <Text style={[styles.statusBtnText, { color: status === s ? colors.primary : colors.mutedForeground }]}>
                {s === "draft" ? "Save as Draft" : "Publish Now"}
              </Text>
            </Pressable>
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {uploading && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
          </View>
        )}

        <Pressable
          style={({ pressed }) => [styles.uploadBtn, !canSubmit && styles.uploadBtnDisabled, pressed && canSubmit && { opacity: 0.85 }]}
          onPress={handleUpload}
          disabled={!canSubmit}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.uploadBtnText}>Upload Lecture</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}
