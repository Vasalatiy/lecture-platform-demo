import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useGetVideo, useUpdateVideo } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import * as Haptics from "expo-haptics";

export default function EditVideoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: video, isLoading } = useGetVideo(id ?? "");
  const updateVideo = useUpdateVideo();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lecturer, setLecturer] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (video) {
      setTitle(video.title);
      setDescription(video.description ?? "");
      setLecturer(video.lecturer);
      setCategory(video.category);
      setStatus(video.status as "draft" | "published");
    }
  }, [video]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSave = async () => {
    if (!title || !lecturer || !category) {
      setError("Title, lecturer, and category are required.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await updateVideo.mutateAsync({
        id: id!,
        data: { title, description, lecturer, category, videoUrl: video!.videoUrl, status },
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      setError(err.message ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: topPad + 16,
      paddingHorizontal: 20,
      paddingBottom: 16,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    headerTitle: { fontSize: 18, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold" },
    saveBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: colors.radius },
    saveBtnText: { fontSize: 14, fontWeight: "600", color: "#fff", fontFamily: "Inter_600SemiBold" },
    scroll: { padding: 20, paddingBottom: bottomPad + 40 },
    label: { fontSize: 14, fontWeight: "600", color: colors.foreground, fontFamily: "Inter_600SemiBold", marginBottom: 8, marginTop: 16 },
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
    statusRow: { flexDirection: "row", gap: 10, marginTop: 8 },
    statusBtn: { flex: 1, height: 44, borderWidth: 1.5, borderRadius: colors.radius, justifyContent: "center", alignItems: "center" },
    statusBtnText: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
    error: { fontSize: 13, color: colors.destructive, fontFamily: "Inter_400Regular", marginTop: 12 },
    loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  });

  if (isLoading) {
    return <View style={styles.loadingWrap}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Lecture</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.saveBtn, saving && { opacity: 0.5 }, pressed && { opacity: 0.8 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save</Text>}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Title</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Lecture title" placeholderTextColor={colors.mutedForeground} />

        <Text style={styles.label}>Description</Text>
        <TextInput style={styles.textArea} value={description} onChangeText={setDescription} placeholder="Brief description" placeholderTextColor={colors.mutedForeground} multiline numberOfLines={4} />

        <Text style={styles.label}>Lecturer</Text>
        <TextInput style={styles.input} value={lecturer} onChangeText={setLecturer} placeholder="Lecturer name" placeholderTextColor={colors.mutedForeground} />

        <Text style={styles.label}>Course / Category</Text>
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
                {s === "draft" ? "Draft" : "Published"}
              </Text>
            </Pressable>
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
    </View>
  );
}
