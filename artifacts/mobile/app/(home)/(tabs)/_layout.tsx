import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Platform } from "react-native";
import { BlurView } from "expo-blur";
import { StyleSheet, View } from "react-native";
import React from "react";
import { useColors } from "@/hooks/useColors";
import { useUserProfile } from "@/contexts/AuthContext";

export default function TabLayout() {
  const colors = useColors();
  const { isAdmin } = useUserProfile();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
          ),
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 11,
          marginBottom: isWeb ? 8 : 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Lectures",
          tabBarIcon: ({ color, size }) => <Feather name="play-circle" size={size} color={color} />,
        }}
      />
      {isAdmin && (
        <Tabs.Screen
          name="admin"
          options={{
            title: "Admin",
            tabBarIcon: ({ color, size }) => <Feather name="settings" size={size} color={color} />,
          }}
        />
      )}
      {!isAdmin && (
        <Tabs.Screen
          name="admin"
          options={{
            href: null,
          }}
        />
      )}
    </Tabs>
  );
}
