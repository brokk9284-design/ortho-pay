import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { api } from "@/lib/api";
import { theme } from "@/lib/theme";

interface Notification {
  notification_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async () => {
    try {
      const data = await api.notifications.list();
      setNotifications((data as { notifications: Notification[] }).notifications || []);
    } catch {
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const getIconColor = (type: string) => {
    if (type === "escrow") return theme.colors.terminalYellow;
    if (type === "payment") return theme.colors.terminalGreen;
    if (type === "kyc") return theme.colors.ink;
    if (type === "security") return theme.colors.terminalRed;
    return theme.colors.charcoal;
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.canvas }}
      contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingTop: 56, paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.ink} />}
    >
      <Text style={styles.title}>Notifications</Text>

      {notifications.length === 0 ? (
        <Text style={{ color: theme.colors.charcoal, fontSize: 13, textAlign: "center", paddingVertical: 32 }}>
          No notifications yet
        </Text>
      ) : (
        notifications.map((n) => (
          <View
            key={n.notification_id}
            style={[styles.notifCard, !n.is_read && { backgroundColor: theme.colors.surface }]}
          >
            <View style={[styles.notifDot, { backgroundColor: getIconColor(n.type) }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.notifTitle}>{n.title}</Text>
              <Text style={styles.notifMessage}>{n.message}</Text>
              <Text style={styles.notifTime}>{new Date(n.created_at).toLocaleString()}</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "700", color: theme.colors.ink, marginBottom: 16 },
  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  notifTitle: { fontSize: 14, fontWeight: "600", color: theme.colors.ink },
  notifMessage: { fontSize: 13, color: theme.colors.body, marginTop: 4 },
  notifTime: { fontSize: 11, color: theme.colors.mute, marginTop: 6 },
});
