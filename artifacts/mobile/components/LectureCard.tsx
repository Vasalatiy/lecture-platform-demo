import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface Video {
  id: string;
  title: string;
  description: string;
  lecturer: string;
  category: string;
  status: string;
  createdAt: string;
}

interface LectureCardProps {
  video: Video;
  onPress: () => void;
  showStatus?: boolean;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

export function LectureCard({ video, onPress, showStatus }: LectureCardProps) {
  const colors = useColors();

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    thumbnail: {
      width: "100%",
      aspectRatio: 16 / 9,
      backgroundColor: "#1E3A8A",
      justifyContent: "center",
      alignItems: "center",
    },
    playCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: "rgba(255,255,255,0.15)",
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: "rgba(255,255,255,0.3)",
    },
    categoryRow: {
      position: "absolute",
      top: 10,
      left: 10,
    },
    categoryBadge: {
      backgroundColor: "rgba(30,64,175,0.9)",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 20,
    },
    categoryText: {
      fontSize: 11,
      fontWeight: "600",
      color: "#fff",
      fontFamily: "Inter_600SemiBold",
    },
    body: { padding: 14 },
    title: { fontSize: 15, fontWeight: "600", color: colors.foreground, fontFamily: "Inter_600SemiBold", marginBottom: 4, lineHeight: 22 },
    description: { fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginBottom: 10, lineHeight: 18 },
    meta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    metaLeft: { flexDirection: "row", alignItems: "center", gap: 4 },
    metaText: { fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 20 },
    statusText: { fontSize: 11, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  });

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]} onPress={onPress}>
      <View style={styles.thumbnail}>
        <View style={styles.playCircle}>
          <Feather name="play" size={20} color="#fff" />
        </View>
        <View style={styles.categoryRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{video.category}</Text>
          </View>
        </View>
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{video.title}</Text>
        {video.description ? (
          <Text style={styles.description} numberOfLines={2}>{video.description}</Text>
        ) : null}
        <View style={styles.meta}>
          <View style={styles.metaLeft}>
            <Feather name="user" size={12} color={colors.mutedForeground} />
            <Text style={styles.metaText}>{video.lecturer}</Text>
          </View>
          <View style={styles.metaLeft}>
            {showStatus && (
              <View style={[styles.statusBadge, { backgroundColor: video.status === "published" ? "#DCFCE7" : "#FEF9C3" }]}>
                <Text style={[styles.statusText, { color: video.status === "published" ? "#16A34A" : "#D97706" }]}>
                  {video.status}
                </Text>
              </View>
            )}
            <Text style={styles.metaText}>{formatDate(video.createdAt)}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
