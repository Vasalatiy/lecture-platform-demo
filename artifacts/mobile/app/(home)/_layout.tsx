import { useAuth } from "@clerk/expo";
import { Redirect, Stack } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider } from "@/contexts/AuthContext";

export default function HomeLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" }}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="lecture/[id]" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="admin/upload" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="admin/edit/[id]" options={{ headerShown: false, animation: "slide_from_right" }} />
      </Stack>
    </AuthProvider>
  );
}
