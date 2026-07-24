import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { api } from "@/lib/api";
import { theme } from "@/lib/theme";

export default function TwoFactorScreen() {
  const params = useLocalSearchParams<{
    payment_id: string;
    purpose: string;
    amount: string;
    counterparty: string;
    method: string;
  }>();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [requestingCode, setRequestingCode] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    requestCode();
  }, []);

  const requestCode = async () => {
    if (!params.purpose) return;
    setRequestingCode(true);
    try {
      await api.payments.request2fa(params.purpose);
    } catch {
      // silent — code may already be sent
    } finally {
      setRequestingCode(false);
    }
  };

  const handleVerify = async () => {
    if (code.length < 6) return;
    setLoading(true);
    setError("");
    try {
      await api.payments.verify2fa(code, params.purpose);
      setSuccess("Verified! Completing payment...");

      if (params.purpose === "send_payment" && params.payment_id) {
        const result = await api.wallet.send(
          params.counterparty,
          parseFloat(params.amount),
          params.method,
          code
        );
        const p = result as { payment: { reference: string } };
        setSuccess(`Payment in escrow. Reference: ${p.payment?.reference || ""}`);
        setTimeout(() => router.replace("/(tabs)/activity"), 2000);
      } else {
        setTimeout(() => router.back(), 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Cancel</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>🔐</Text>
        </View>

        <Text style={styles.title}>Enter Verification Code</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to your email{"\n"}
          {params.purpose === "send_payment" ? "to authorize this payment" : "for verification"}
        </Text>

        {params.amount && (
          <View style={styles.paymentSummary}>
            <Text style={styles.summaryLabel}>Amount</Text>
            <Text style={styles.summaryValue}>${params.amount}</Text>
            {params.counterparty && (
              <>
                <Text style={[styles.summaryLabel, { marginTop: 8 }]}>To</Text>
                <Text style={styles.summaryValue}>${params.counterparty}</Text>
              </>
            )}
          </View>
        )}

        <TextInput
          ref={inputRef}
          style={styles.codeInput}
          value={code}
          onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000"
          placeholderTextColor={theme.colors.mute}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {success ? <Text style={styles.successText}>{success}</Text> : null}

        <TouchableOpacity
          style={[styles.verifyButton, (code.length < 6 || loading) && { opacity: 0.5 }]}
          onPress={handleVerify}
          disabled={code.length < 6 || loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.primaryText} />
          ) : (
            <Text style={styles.verifyButtonText}>Verify & Confirm</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={requestCode} style={styles.resendButton} disabled={requestingCode}>
          <Text style={styles.resendText}>
            {requestingCode ? "Sending..." : "Resend code"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.canvas },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: 56,
    paddingBottom: theme.spacing.sm,
  },
  backButton: { fontSize: 14, color: theme.colors.charcoal },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.surfaceSoft,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  iconText: { fontSize: 32 },
  title: { fontSize: 20, fontWeight: "700", color: theme.colors.ink, marginBottom: 8 },
  subtitle: { fontSize: 13, color: theme.colors.charcoal, textAlign: "center", marginBottom: 32, lineHeight: 20 },
  paymentSummary: {
    alignItems: "center",
    marginBottom: 32,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
  },
  summaryLabel: { fontSize: 10, textTransform: "uppercase", color: theme.colors.charcoal, fontWeight: "600" },
  summaryValue: { fontSize: 18, fontWeight: "700", color: theme.colors.ink, fontFamily: "monospace" },
  codeInput: {
    width: 200,
    height: 56,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.hairline,
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    color: theme.colors.ink,
    letterSpacing: 8,
    marginBottom: 24,
  },
  errorText: { color: theme.colors.terminalRed, fontSize: 13, marginBottom: 16, textAlign: "center" },
  successText: { color: theme.colors.terminalGreen, fontSize: 13, marginBottom: 16, textAlign: "center" },
  verifyButton: {
    width: "100%",
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.ink,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  verifyButtonText: { color: theme.colors.primaryText, fontSize: 16, fontWeight: "600" },
  resendButton: { padding: 8 },
  resendText: { color: theme.colors.charcoal, fontSize: 13 },
});
