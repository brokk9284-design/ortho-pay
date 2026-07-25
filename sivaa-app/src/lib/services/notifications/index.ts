import type { Notification, NotificationPreference, NotificationCategory, NotificationChannel } from "@/types";

export interface INotificationService {
  sendNotification(userId: string, title: string, message: string, category: NotificationCategory, channels?: NotificationChannel[]): Promise<Notification>;
  queueNotification(notificationId: string, channels: NotificationChannel[]): Promise<void>;
  getPreferences(userId: string): Promise<NotificationPreference | null>;
  updatePreferences(userId: string, prefs: Partial<NotificationPreference>): Promise<void>;
  markAsRead(notificationId: string): Promise<void>;
  markAllRead(userId: string): Promise<void>;
  listNotifications(userId: string, page: number, limit: number): Promise<{ data: Notification[]; total: number }>;
}
