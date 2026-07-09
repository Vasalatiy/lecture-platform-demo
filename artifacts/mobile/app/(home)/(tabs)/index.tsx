import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useListVideos } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { LectureCard } from "@/components/LectureCard";

export default function CatalogScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const { data: videos, isLoading, refetch } = useListVideos({ search: search || undefined, category: category || undefined });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

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
    title: { fontSize: 24, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold", marginBottom: 16 },
    searchWrap: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.muted,
      borderRadius: colors.radius,
      paddingHorizontal: 12,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      height: 42,
      fontSize: 15,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
    },
    listContent: {
      padding: 16,
      paddingBottom: bottomPad + 100,
      gap: 12,
    },
    emptyWrap: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
    emptyText: { fontSize: 16, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    emptySubtext: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Lectures</Text>
        <View style={styles.searchWrap}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search lectures..."
            placeholderTextColor={colors.mutedForeground}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
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
          renderItem={({ item }) => (
            <LectureCard
              video={item}
              onPress={() => router.push(`/(home)/lecture/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          scrollEnabled={!!(videos && videos.length > 0)}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Feather name="film" size={48} color={colors.mutedForeground} />
              <Text style={styles.emptyText}>
                {search ? "No lectures match your search" : "No published lectures yet"}
              </Text>
              <Text style={styles.emptySubtext}>Check back soon</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
