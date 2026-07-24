import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Alert,
  Modal,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { theme } from "@/lib/theme";

interface KycDocument {
  document_id: string;
  document_type: string;
  file_url: string;
  status: string;
  created_at: string;
}

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const [kycDocs, setKycDocs] = useState<KycDocument[]>([]);
  const [showKycModal, setShowKycModal] = useState(false);
  const [kycType, setKycType] = useState("passport");
  const [kycFile, setKycFile] = useState<{ uri: string; type: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  const loadKyc = async () => {
    try {
      const data = await api.kyc.list();
      setKycDocs((data as { documents: KycDocument[] }).documents || []);
    } catch {
    }
  };

  useEffect(() => {
    loadKyc();
  }, []);

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: () => logout().then(() => router.replace("/(auth)/login")) },
    ]);
  };

  const pickFile = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setKycFile({
        uri: asset.uri,
        type: asset.type || "image/jpeg",
        name: asset.fileName || `document_${Date.now()}.jpg`,
      });
    }
  };

  const handleKycSubmit = async () => {
    if (!kycFile) {
      Alert.alert("Error", "Please select a file first");
      return;
    }
    setUploading(true);
    try {
      await api.kyc.upload(kycType, kycFile);
      setShowKycModal(false);
      setKycFile(null);
      loadKyc();
    } catch (err) {
      Alert.alert("Error", (err as Error).message);
    }
    setUploading(false);
  };

  const kycStatusColor = (status: string) => {
    if (status === "approved") return theme.colors.terminalGreen;
    if (status === "pending") return theme.colors.terminalYellow;
    return theme.colors.terminalRed;
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.canvas }} contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingTop: 56, paddingBottom: 24 }}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.name || "?").charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{user?.name}</Text>
          <Text style={styles.profileTag}>${user?.siva_tag}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Country</Text>
        <Text style={styles.infoValue}>{user?.country === "GB" ? "🇬🇧 UK" : "🇺🇸 USA"}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>KYC Status</Text>
        <Text style={[styles.infoValue, { color: kycStatusColor(user?.kyc_status || "unverified"), textTransform: "capitalize" }]}>
          {user?.kyc_status || "unverified"}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>KYC Documents</Text>
      {kycDocs.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No documents submitted yet.</Text>
          <TouchableOpacity onPress={() => setShowKycModal(true)} style={styles.submitBtn}>
            <Text style={{ color: theme.colors.primaryText, fontSize: 13, fontWeight: "600" }}>Submit Document</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          {kycDocs.map((doc) => (
            <View key={doc.document_id} style={styles.kycRow}>
              <View>
                <Text style={styles.kycType}>{doc.document_type.replace(/_/g, " ")}</Text>
                <Text style={styles.kycDate}>{new Date(doc.created_at).toLocaleDateString()}</Text>
              </View>
              <Text style={[styles.kycStatus, { color: kycStatusColor(doc.status) }]}>
                {doc.status}
              </Text>
            </View>
          ))}
          <TouchableOpacity onPress={() => setShowKycModal(true)} style={styles.secondaryBtn}>
            <Text style={{ color: theme.colors.ink, fontSize: 13, fontWeight: "500", textAlign: "center" }}>Submit Another</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionTitle}>Security</Text>
      <TouchableOpacity style={styles.menuRow} onPress={() => Alert.alert("Coming Soon", "PIN management will be available in a future update.")}>
        <Text style={styles.menuText}>Manage PIN</Text>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuRow} onPress={() => Alert.alert("Coming Soon", "Bank account linking will be available in a future update.")}>
        <Text style={styles.menuText}>Linked Bank Accounts</Text>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
        <Text style={{ color: theme.colors.terminalRed, fontSize: 15, fontWeight: "600", textAlign: "center" }}>Log Out</Text>
      </TouchableOpacity>

      <Modal visible={showKycModal} animationType="slide" transparent onRequestClose={() => setShowKycModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Upload KYC Document</Text>

            <Text style={styles.label}>Document Type</Text>
            {["passport", "drivers_license", "utility_bill", "bank_statement"].map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setKycType(t)}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: kycType === t ? theme.colors.ink : theme.colors.hairline,
                  backgroundColor: kycType === t ? theme.colors.ink : theme.colors.surface,
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: kycType === t ? theme.colors.primaryText : theme.colors.ink, fontSize: 14, textTransform: "capitalize" }}>
                  {t.replace(/_/g, " ")}
                </Text>
              </TouchableOpacity>
            ))}

            <Text style={styles.label}>Document File</Text>
            <TouchableOpacity onPress={pickFile} style={[styles.urlInput, { justifyContent: "center" }]}>
              <Text style={{ color: kycFile ? theme.colors.ink : theme.colors.mute, fontSize: 14 }}>
                {kycFile ? kycFile.name : "Tap to select a file (JPG, PNG, PDF)"}
              </Text>
            </TouchableOpacity>

            <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
              <TouchableOpacity onPress={() => setShowKycModal(false)} style={[styles.modalBtn, { flex: 1, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.hairline }]}>
                <Text style={{ color: theme.colors.ink, fontSize: 14, fontWeight: "500", textAlign: "center" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleKycSubmit} disabled={uploading} style={[styles.modalBtn, { flex: 1, backgroundColor: uploading ? theme.colors.mute : theme.colors.ink }]}>
                <Text style={{ color: theme.colors.primaryText, fontSize: 14, fontWeight: "600", textAlign: "center" }}>{uploading ? "Uploading..." : "Submit"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "700", color: theme.colors.ink, marginBottom: 16 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.ink,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 20, fontWeight: "700", color: theme.colors.primaryText },
  profileName: { fontSize: 16, fontWeight: "600", color: theme.colors.ink },
  profileTag: { fontSize: 14, color: theme.colors.charcoal, marginTop: 2 },
  profileEmail: { fontSize: 12, color: theme.colors.mute, marginTop: 2 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.hairline,
  },
  infoLabel: { fontSize: 13, color: theme.colors.charcoal },
  infoValue: { fontSize: 14, fontWeight: "500", color: theme.colors.ink },
  sectionTitle: { fontSize: 12, fontWeight: "500", textTransform: "uppercase", color: theme.colors.charcoal, marginTop: 24, marginBottom: 12 },
  emptyBox: {
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 12,
  },
  emptyText: { fontSize: 13, color: theme.colors.charcoal, textAlign: "center" },
  submitBtn: {
    backgroundColor: theme.colors.ink,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  kycRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  kycType: { fontSize: 14, fontWeight: "500", color: theme.colors.ink, textTransform: "capitalize" },
  kycDate: { fontSize: 11, color: theme.colors.mute, marginTop: 2 },
  kycStatus: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  secondaryBtn: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 8,
  },
  menuRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.hairline,
  },
  menuText: { fontSize: 15, color: theme.colors.ink },
  menuArrow: { fontSize: 20, color: theme.colors.mute },
  logoutBtn: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "rgba(239, 68, 68, 0.08)",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalCard: {
    backgroundColor: theme.colors.canvas,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: theme.colors.ink, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: "500", textTransform: "uppercase", color: theme.colors.charcoal, marginBottom: 8, marginTop: 12 },
  urlInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: theme.colors.ink,
  },
  modalBtn: {
    paddingVertical: 14,
    borderRadius: 12,
  },
});
