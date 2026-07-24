import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "@/lib/auth-store";
import { theme } from "@/lib/theme";

export default function RegisterScreen() {
  const { register, loading, error, clearError } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("US");

  const handleRegister = async () => {
    await register(name, email, password, country);
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
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: theme.spacing.lg }}>
        <Text style={{ fontSize: 32, fontWeight: "700", color: theme.colors.ink, marginBottom: 8, textAlign: "center" }}>
          Create Account
        </Text>
        <Text style={{ fontSize: 14, color: theme.colors.charcoal, textAlign: "center", marginBottom: 32 }}>
          Get your $SIVA tag and start sending.
        </Text>

        {error && (
          <View style={{ backgroundColor: "#FEF2F2", borderRadius: 12, padding: 12, marginBottom: 16 }}>
            <Text style={{ color: theme.colors.terminalRed, fontSize: 13 }}>{error}</Text>
          </View>
        )}

        <View style={{ gap: 12 }}>
          <View>
            <Text style={{ fontSize: 12, fontWeight: "500", color: theme.colors.charcoal, marginBottom: 6, textTransform: "uppercase" }}>Name</Text>
            <TextInput
              value={name}
              onChangeText={(v) => { setName(v); clearError(); }}
              placeholder="Alice Smith"
              placeholderTextColor={theme.colors.mute}
              style={inputStyle}
            />
          </View>

          <View>
            <Text style={{ fontSize: 12, fontWeight: "500", color: theme.colors.charcoal, marginBottom: 6, textTransform: "uppercase" }}>Email</Text>
            <TextInput
              value={email}
              onChangeText={(v) => { setEmail(v); clearError(); }}
              placeholder="you@example.com"
              placeholderTextColor={theme.colors.mute}
              keyboardType="email-address"
              autoCapitalize="none"
              style={inputStyle}
            />
          </View>

          <View>
            <Text style={{ fontSize: 12, fontWeight: "500", color: theme.colors.charcoal, marginBottom: 6, textTransform: "uppercase" }}>Password</Text>
            <TextInput
              value={password}
              onChangeText={(v) => { setPassword(v); clearError(); }}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.mute}
              secureTextEntry
              style={inputStyle}
            />
          </View>

          <View>
            <Text style={{ fontSize: 12, fontWeight: "500", color: theme.colors.charcoal, marginBottom: 6, textTransform: "uppercase" }}>Country</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {["US", "GB"].map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCountry(c)}
                  style={{
                    flex: 1,
                    backgroundColor: country === c ? theme.colors.ink : theme.colors.surface,
                    borderWidth: 1,
                    borderColor: country === c ? theme.colors.ink : theme.colors.hairline,
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: country === c ? theme.colors.primaryText : theme.colors.ink, fontSize: 14, fontWeight: "600" }}>
                    {c === "US" ? "🇺🇸 USA" : "🇬🇧 UK"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            onPress={handleRegister}
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
              {loading ? "Creating..." : "Create Account"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/(auth)/login")} style={{ alignItems: "center", marginTop: 8 }}>
            <Text style={{ color: theme.colors.charcoal, fontSize: 14 }}>
              Already have an account? <Text style={{ fontWeight: "600", color: theme.colors.ink }}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const inputStyle = {
  backgroundColor: theme.colors.surface,
  borderWidth: 1,
  borderColor: theme.colors.hairline,
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 14,
  fontSize: 16,
  color: theme.colors.ink,
};
