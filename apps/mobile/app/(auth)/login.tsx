import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "@/lib/auth-store";
import { theme } from "@/lib/theme";

export default function LoginScreen() {
  const { login, loading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    await login(email, password);
    const { user } = useAuthStore.getState();
    if (user) {
      router.replace("/(tabs)");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: theme.colors.canvas }}
    >
      <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: theme.spacing.lg }}>
        <Text style={{ fontSize: 32, fontWeight: "700", color: theme.colors.ink, marginBottom: 8, textAlign: "center" }}>
          ORTHO-PAY
        </Text>
        <Text style={{ fontSize: 14, color: theme.colors.charcoal, textAlign: "center", marginBottom: 32 }}>
          Escrow payments, secured.
        </Text>

        {error && (
          <View style={{ backgroundColor: "#FEF2F2", borderRadius: 12, padding: 12, marginBottom: 16 }}>
            <Text style={{ color: theme.colors.terminalRed, fontSize: 13 }}>{error}</Text>
          </View>
        )}

        <View style={{ gap: 12 }}>
          <View>
            <Text style={{ fontSize: 12, fontWeight: "500", color: theme.colors.charcoal, marginBottom: 6, textTransform: "uppercase" }}>
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={(v) => { setEmail(v); clearError(); }}
              placeholder="you@example.com"
              placeholderTextColor={theme.colors.mute}
              keyboardType="email-address"
              autoCapitalize="none"
              style={{
                backgroundColor: theme.colors.surface,
                borderWidth: 1,
                borderColor: theme.colors.hairline,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 16,
                color: theme.colors.ink,
              }}
            />
          </View>

          <View>
            <Text style={{ fontSize: 12, fontWeight: "500", color: theme.colors.charcoal, marginBottom: 6, textTransform: "uppercase" }}>
              Password
            </Text>
            <TextInput
              value={password}
              onChangeText={(v) => { setPassword(v); clearError(); }}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.mute}
              secureTextEntry
              style={{
                backgroundColor: theme.colors.surface,
                borderWidth: 1,
                borderColor: theme.colors.hairline,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 16,
                color: theme.colors.ink,
              }}
            />
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={{
              backgroundColor: theme.colors.ink,
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: "center",
              marginTop: 8,
              opacity: loading ? 0.6 : 1,
            }}
          >
            <Text style={{ color: theme.colors.primaryText, fontSize: 16, fontWeight: "600" }}>
              {loading ? "Signing in..." : "Sign In"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/(auth)/register")} style={{ alignItems: "center", marginTop: 8 }}>
            <Text style={{ color: theme.colors.charcoal, fontSize: 14 }}>
              Don't have an account? <Text style={{ fontWeight: "600", color: theme.colors.ink }}>Register</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
