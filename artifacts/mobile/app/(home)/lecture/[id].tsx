import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useGetVideo, useGetVideoStreamUrl } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return iso;
  }
}

function VideoPlayer({ url }: { url: string }) {
  if (Platform.OS === "web") {
    return (
      <video
        src={url}
        controls
        style={{ width: "100%", height: "100%", objectFit: "contain", backgroundColor: "#000" }}
        playsInline
        preload="metadata"
      />
    );
  }
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Feather name="film" size={40} color="rgba(255,255,255,0.4)" />
      <Text style={{ color: "rgba(255,255,255,0.6)", marginTop: 12, fontFamily: "Inter_400Regular", fontSize: 14 }}>
        Open in browser to watch
      </Text>
    </View>
  );
}

export default function LectureScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: video, isLoading: videoLoading } = useGetVideo(id ?? "");
  const { data: streamData, isLoading: streamLoading } = useGetVideoStreamUrl(id ?? "");

  const topPad = Platform.OS === "web" ? 0 : insets.top;

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000" },
    loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
    backBtn: {
      position: "absolute",
      top: topPad + 8,
      left: 16,
      zIndex: 10,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    videoContainer: {
      width: "100%",
      aspectRatio: 16 / 9,
      backgroundColor: "#000",
      justifyContent: "center",
      alignItems: "center",
    },
    noVideoText: { color: "#fff", fontFamily: "Inter_400Regular" },
    content: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 20,
      paddingBottom: Math.max(insets.bottom, Platform.OS === "web" ? 34 : 0) + 20,
    },
    category: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.primary,
      fontFamily: "Inter_600SemiBold",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    title: { fontSize: 22, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold", marginBottom: 12, lineHeight: 30 },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 16, flexWrap: "wrap" },
    metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    metaText: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    divider: { height: 1, backgroundColor: colors.border, marginBottom: 16 },
    sectionTitle: { fontSize: 14, fontWeight: "600", color: colors.foreground, fontFamily: "Inter_600SemiBold", marginBottom: 8 },
    description: { fontSize: 15, color: colors.foreground, fontFamily: "Inter_400Regular", lineHeight: 24 },
  });

  if (videoLoading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!video) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>Lecture not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        {streamData?.url ? (
          <VideoPlayer url={streamData.url} />
        ) : streamLoading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : (
          <Text style={styles.noVideoText}>Video unavailable</Text>
        )}
      </View>

      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Feather name="arrow-left" size={18} color="#fff" />
      </Pressable>

      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.category}>{video.category}</Text>
          <Text style={styles.title}>{video.title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Feather name="user" size={14} color={colors.mutedForeground} />
              <Text style={styles.metaText}>{video.lecturer}</Text>
            </View>
            <View style={styles.metaItem}>
              <Feather name="calendar" size={14} color={colors.mutedForeground} />
              <Text style={styles.metaText}>{formatDate(video.createdAt)}</Text>
            </View>
          </View>

          {video.description ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>About this lecture</Text>
              <Text style={styles.description}>{video.description}</Text>
            </>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
