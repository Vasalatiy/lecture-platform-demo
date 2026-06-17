import React, { useState } from "react";
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
import { useSignIn } from "@clerk/expo";
import { Link, useRouter, type Href } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

export default function SignInScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");

  const isLoading = fetchStatus === "fetching";

  const handleSignIn = async () => {
    const { error } = await signIn.password({ emailAddress: email, password });
    if (error) return;

    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ decorateUrl }) => {
          const url = decorateUrl("/");
          if (url.startsWith("http")) {
            window.location.href = url;
          } else {
            router.replace("/(home)/(tabs)" as Href);
          }
        },
      });
    }
  };

  const handleVerify = async () => {
    await signIn.mfa.verifyEmailCode({ code: verifyCode });
    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ decorateUrl }) => {
          const url = decorateUrl("/");
          if (url.startsWith("http")) {
            window.location.href = url;
          } else {
            router.replace("/(home)/(tabs)" as Href);
          }
        },
      });
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flexGrow: 1,
      justifyContent: "center",
      padding: 24,
      paddingTop: Math.max(insets.top + 24, Platform.OS === "web" ? 91 : 24),
      paddingBottom: Math.max(insets.bottom + 24, Platform.OS === "web" ? 58 : 24),
    },
    header: {
      marginBottom: 40,
    },
    logoCircle: {
      width: 64,
      height: 64,
      borderRadius: 16,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 15,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
      marginBottom: 8,
      marginTop: 16,
    },
    inputWrap: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: colors.radius,
      backgroundColor: colors.card,
    },
    input: {
      flex: 1,
      height: 48,
      paddingHorizontal: 14,
      fontSize: 15,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
    },
    eyeBtn: {
      padding: 12,
    },
    error: {
      fontSize: 13,
      color: colors.destructive,
      fontFamily: "Inter_400Regular",
      marginTop: 6,
    },
    btn: {
      height: 50,
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 28,
    },
    btnDisabled: {
      opacity: 0.5,
    },
    btnText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.primaryForeground,
      fontFamily: "Inter_600SemiBold",
    },
    footer: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 24,
      gap: 4,
    },
    footerText: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    link: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: "600",
      fontFamily: "Inter_600SemiBold",
    },
  });

  if (signIn.status === "needs_client_trust") {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text style={styles.title}>Verify your identity</Text>
            <Text style={styles.subtitle}>Enter the code sent to your email</Text>
          </View>
          <Text style={styles.label}>Verification code</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={verifyCode}
              onChangeText={setVerifyCode}
              keyboardType="numeric"
              placeholder="000000"
              placeholderTextColor={colors.mutedForeground}
            />
          </View>
          {errors.fields.code && <Text style={styles.error}>{errors.fields.code.message}</Text>}
          <Pressable
            style={({ pressed }) => [styles.btn, (isLoading || !verifyCode) && styles.btnDisabled, pressed && { opacity: 0.8 }]}
            onPress={handleVerify}
            disabled={isLoading || !verifyCode}
          >
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verify</Text>}
          </Pressable>
          <Pressable onPress={() => signIn.mfa.sendEmailCode()}>
            <Text style={[styles.footerText, { textAlign: "center", marginTop: 16 }]}>Resend code</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Feather name="play" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to access your lectures</Text>
        </View>

        <Text style={styles.label}>Email address</Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor={colors.mutedForeground}
            autoComplete="email"
          />
        </View>
        {errors.fields.identifier && <Text style={styles.error}>{errors.fields.identifier.message}</Text>}

        <Text style={styles.label}>Password</Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.mutedForeground}
            autoComplete="password"
          />
          <Pressable style={styles.eyeBtn} onPress={() => setShowPassword((v) => !v)}>
            <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>
        {errors.fields.password && <Text style={styles.error}>{errors.fields.password.message}</Text>}

        <Pressable
          style={({ pressed }) => [styles.btn, (!email || !password || isLoading) && styles.btnDisabled, pressed && { opacity: 0.85 }]}
          onPress={handleSignIn}
          disabled={!email || !password || isLoading}
        >
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign in</Text>}
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <Link href="/(auth)/sign-up">
            <Text style={styles.link}> Sign up</Text>
          </Link>
        </View>
      </ScrollView>
    </View>
  );
}
