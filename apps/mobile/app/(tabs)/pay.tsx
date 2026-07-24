import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, router } from "expo-router";
import { api } from "@/lib/api";
import { theme } from "@/lib/theme";

interface PaymentMethod {
  method_id: string;
  code: string;
  display_name: string;
  icon_key: string;
  fee_percentage: number;
  fee_fixed: number;
  min_amount: number;
  max_amount: number | null;
}

export default function PayScreen() {
  const params = useLocalSearchParams<{ tag?: string }>();
  const [tag, setTag] = useState("");
  const [amount, setAmount] = useState("");
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lastPaymentId, setLastPaymentId] = useState("");
  const [receiptFile, setReceiptFile] = useState<{ uri: string; type: string; name: string } | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  useEffect(() => {
    if (params.tag) {
      setTag(params.tag.toLowerCase().replace(/[^a-z0-9_]/g, ""));
    }
  }, [params.tag]);

  useEffect(() => {
    api.paymentMethods.list().then((data: unknown) => {
      const d = data as { payment_methods: PaymentMethod[] };
      if (d.payment_methods) {
        setMethods(d.payment_methods);
        if (d.payment_methods.length > 0) {
          setSelectedMethod(d.payment_methods[0].method_id);
        }
      }
    }).catch(() => {});
  }, []);

  const selectedMethodData = methods.find((m) => m.method_id === selectedMethod);

  const handleSend = async () => {
    setError("");
    setSuccess("");

    if (!tag || !amount || !selectedMethod) {
      setError("Please fill in all fields");
      return;
    }

    router.push(`/2fa?purpose=send_payment&counterparty=${tag}&amount=${amount}&method=${selectedMethod}`);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.canvas }} contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingTop: 56, paddingBottom: 24 }}>
      <Text style={styles.title}>Send Payment</Text>
      <Text style={styles.subtitle}>Funds are held in escrow until admin approval.</Text>

      {error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}
      {success && <View style={styles.successBox}><Text style={styles.successText}>{success}</Text></View>}

      <Text style={styles.label}>Recipient $ORTHO Tag</Text>
      <View style={styles.tagInput}>
        <Text style={{ fontSize: 18, fontWeight: "600", color: theme.colors.charcoal }}>$</Text>
        <TextInput
          value={tag}
          onChangeText={(v) => setTag(v.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
          placeholder="bob"
          placeholderTextColor={theme.colors.mute}
          autoCapitalize="none"
          style={{ flex: 1, fontSize: 16, color: theme.colors.ink, paddingHorizontal: 8 }}
        />
      </View>

      <Text style={styles.label}>Amount (USD)</Text>
      <View style={styles.tagInput}>
        <Text style={{ fontSize: 18, fontWeight: "600", color: theme.colors.charcoal }}>$</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor={theme.colors.mute}
          keyboardType="decimal-pad"
          style={{ flex: 1, fontSize: 16, color: theme.colors.ink, paddingHorizontal: 8, fontFamily: "monospace" }}
        />
      </View>

      <Text style={styles.label}>Payment Method</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {methods.map((m) => (
          <TouchableOpacity
            key={m.method_id}
            onPress={() => setSelectedMethod(m.method_id)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: selectedMethod === m.method_id ? theme.colors.ink : theme.colors.surface,
              borderWidth: 1,
              borderColor: selectedMethod === m.method_id ? theme.colors.ink : theme.colors.hairline,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "500", color: selectedMethod === m.method_id ? theme.colors.primaryText : theme.colors.ink }}>
              {m.display_name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedMethodData && (
        <View style={styles.feeInfo}>
          <Text style={styles.feeText}>
            Fee: {selectedMethodData.fee_percentage}%{selectedMethodData.fee_fixed > 0 ? ` + $${selectedMethodData.fee_fixed}` : ""}
          </Text>
          <Text style={styles.feeText}>
            Limits: ${selectedMethodData.min_amount} — {selectedMethodData.max_amount ? `$${selectedMethodData.max_amount}` : "No max"}
          </Text>
        </View>
      )}

      <TouchableOpacity
        onPress={handleSend}
        disabled={sending || !tag || !amount || !selectedMethod}
        style={[styles.sendBtn, { opacity: sending || !tag || !amount ? 0.5 : 1 }]}
      >
        <Text style={{ color: theme.colors.primaryText, fontSize: 16, fontWeight: "600", textAlign: "center" }}>
          {sending ? "Sending..." : `Send to $${tag || "..."}`}
        </Text>
      </TouchableOpacity>

      {success && lastPaymentId && (
        <View style={{ marginTop: 16 }}>
          <Text style={[styles.label, { marginTop: 0 }]}>Upload Receipt (Optional)</Text>
          <Text style={styles.subtitle}>Upload a screenshot of your payment for faster verification.</Text>
          <TouchableOpacity
            onPress={async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 0.8,
              });
              if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                setReceiptFile({
                  uri: asset.uri,
                  type: asset.type || "image/jpeg",
                  name: asset.fileName || `receipt_${Date.now()}.jpg`,
                });
              }
            }}
            style={[styles.sendBtn, { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.hairline }]}
          >
            <Text style={{ color: theme.colors.ink, fontSize: 14, fontWeight: "500", textAlign: "center" }}>
              {receiptFile ? receiptFile.name : "Select Receipt File"}
            </Text>
          </TouchableOpacity>
          {receiptFile && (
            <TouchableOpacity
              onPress={async () => {
                setUploadingReceipt(true);
                try {
                  await api.receipts.upload(lastPaymentId, receiptFile);
                  setReceiptFile(null);
                  setSuccess("Receipt uploaded successfully. It will be reviewed by our team.");
                } catch (err) {
                  Alert.alert("Error", (err as Error).message);
                }
                setUploadingReceipt(false);
              }}
              disabled={uploadingReceipt}
              style={[styles.sendBtn, { opacity: uploadingReceipt ? 0.5 : 1 }]}
            >
              <Text style={{ color: theme.colors.primaryText, fontSize: 14, fontWeight: "600", textAlign: "center" }}>
                {uploadingReceipt ? "Uploading..." : "Upload Receipt"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "700", color: theme.colors.ink, marginBottom: 4 },
  subtitle: { fontSize: 13, color: theme.colors.charcoal, marginBottom: 24 },
  label: { fontSize: 12, fontWeight: "500", textTransform: "uppercase", color: theme.colors.charcoal, marginBottom: 6, marginTop: 16 },
  tagInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  feeInfo: {
    backgroundColor: theme.colors.surfaceSoft,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  feeText: { fontSize: 12, color: theme.colors.body, marginBottom: 2 },
  sendBtn: {
    backgroundColor: theme.colors.ink,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
  },
  errorBox: { backgroundColor: "#FEF2F2", borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { color: theme.colors.terminalRed, fontSize: 13 },
  successBox: { backgroundColor: "rgba(34,197,94,0.1)", borderRadius: 12, padding: 12, marginBottom: 16 },
  successText: { color: theme.colors.terminalGreen, fontSize: 13 },
});
