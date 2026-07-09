import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import {
  useListVideos,
  useGetVideoStats,
  useDeleteVideo,
  useUpdateVideoStatus,
} from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import * as Haptics from "expo-haptics";

export default function AdminDashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const { data: videos, isLoading, refetch: refetchVideos } = useListVideos({});
  const { data: stats, refetch: refetchStats } = useGetVideoStats();
  const deleteVideo = useDeleteVideo();
  const updateStatus = useUpdateVideoStatus();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchVideos(), refetchStats()]);
    setRefreshing(false);
  }, [refetchVideos, refetchStats]);

  const handleDelete = (id: string, title: string) => {
    if (Platform.OS === "web") {
      if (!confirm(`Delete "${title}"?`)) return;
      deleteVideo.mutateAsync({ id }).then(() => refetchVideos());
      return;
    }
    Alert.alert("Delete Lecture", `Are you sure you want to delete "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await deleteVideo.mutateAsync({ id });
          refetchVideos();
          refetchStats();
        },
      },
    ]);
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "published" ? "draft" : "published";
    await updateStatus.mutateAsync({ id, data: { status: newStatus } });
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    refetchVideos();
    refetchStats();
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: topPad + 16,
      paddingHorizontal: 20,
      paddingBottom: 16,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    title: { fontSize: 24, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold" },
    uploadBtn: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.primary,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: colors.radius,
      gap: 6,
    },
    uploadBtnText: { fontSize: 14, fontWeight: "600", color: "#fff", fontFamily: "Inter_600SemiBold" },
    statsRow: { flexDirection: "row", gap: 10 },
    statCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
    },
    statNum: { fontSize: 22, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold" },
    statLabel: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 2 },
    listContent: { padding: 16, paddingBottom: bottomPad + 100, gap: 10 },
    card: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
    cardTitle: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.foreground, fontFamily: "Inter_600SemiBold", marginRight: 8 },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    badgeText: { fontSize: 11, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
    cardMeta: { fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginBottom: 12 },
    cardActions: { flexDirection: "row", gap: 8 },
    actionBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
    },
    actionBtnText: { fontSize: 13, fontWeight: "500", fontFamily: "Inter_500Medium" },
    emptyWrap: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, paddingTop: 60 },
    emptyText: { fontSize: 16, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Admin</Text>
          <Pressable
            style={({ pressed }) => [styles.uploadBtn, pressed && { opacity: 0.8 }]}
            onPress={() => router.push("/(home)/admin/upload")}
          >
            <Feather name="upload" size={16} color="#fff" />
            <Text style={styles.uploadBtnText}>Upload</Text>
          </Pressable>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{stats?.total ?? "—"}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: colors.success }]}>{stats?.published ?? "—"}</Text>
            <Text style={styles.statLabel}>Published</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: colors.warning }]}>{stats?.draft ?? "—"}</Text>
            <Text style={styles.statLabel}>Draft</Text>
          </View>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={videos ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isPublished = item.status === "published";
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                  <View style={[styles.badge, { backgroundColor: isPublished ? "#DCFCE7" : "#FEF9C3" }]}>
                    <Text style={[styles.badgeText, { color: isPublished ? "#16A34A" : "#D97706" }]}>
                      {isPublished ? "Published" : "Draft"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardMeta}>{item.lecturer} · {item.category}</Text>
                <View style={styles.cardActions}>
                  <Pressable
                    style={({ pressed }) => [styles.actionBtn, { borderColor: isPublished ? colors.warning : colors.success }, pressed && { opacity: 0.7 }]}
                    onPress={() => handleToggleStatus(item.id, item.status)}
                  >
                    <Feather name={isPublished ? "eye-off" : "eye"} size={14} color={isPublished ? colors.warning : colors.success} />
                    <Text style={[styles.actionBtnText, { color: isPublished ? colors.warning : colors.success }]}>
                      {isPublished ? "Unpublish" : "Publish"}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.actionBtn, { borderColor: colors.border }, pressed && { opacity: 0.7 }]}
                    onPress={() => router.push(`/(home)/admin/edit/${item.id}`)}
                  >
                    <Feather name="edit-2" size={14} color={colors.foreground} />
                    <Text style={[styles.actionBtnText, { color: colors.foreground }]}>Edit</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.actionBtn, { borderColor: colors.destructive }, pressed && { opacity: 0.7 }]}
                    onPress={() => handleDelete(item.id, item.title)}
                  >
                    <Feather name="trash-2" size={14} color={colors.destructive} />
                    <Text style={[styles.actionBtnText, { color: colors.destructive }]}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Feather name="film" size={48} color={colors.mutedForeground} />
              <Text style={styles.emptyText}>No lectures uploaded yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
