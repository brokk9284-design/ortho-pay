import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import type { Notification, NotificationPreference, NotificationCategory, NotificationChannel } from "@/types";
import type { INotificationService } from "./index";

export class NotificationService implements INotificationService {
  async sendNotification(
    userId: string,
    title: string,
    message: string,
    category: NotificationCategory,
    channels?: NotificationChannel[]
  ): Promise<Notification> {
    const supabase = await createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        title,
        message,
        category,
        read: false,
      })
      .select()
      .single();

    if (error || !data) throw new Error(`Failed to create notification: ${error?.message}`);

    const targetChannels = channels || ["in_app"];
    await this.queueNotification(data.id, targetChannels);

    return data as Notification;
  }

  async queueNotification(notificationId: string, channels: NotificationChannel[]): Promise<void> {
    const supabase = await createSupabaseAdminClient();

    for (const channel of channels) {
      await supabase.from("notification_deliveries").insert({
        notification_id: notificationId,
        channel,
        status: "pending",
      });
    }
  }

  async getPreferences(userId: string): Promise<NotificationPreference | null> {
    const supabase = await createSupabaseAdminClient();
    const { data } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();
    return data as NotificationPreference | null;
  }

  async updatePreferences(userId: string, prefs: Partial<NotificationPreference>): Promise<void> {
    const supabase = await createSupabaseAdminClient();
    await supabase
      .from("notification_preferences")
      .upsert({ user_id: userId, ...prefs, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
  }

  async markAsRead(notificationId: string): Promise<void> {
    const supabase = await createSupabaseAdminClient();
    await supabase.from("notifications").update({ read: true }).eq("id", notificationId);
  }

  async markAllRead(userId: string): Promise<void> {
    const supabase = await createSupabaseAdminClient();
    await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
  }

  async listNotifications(userId: string, page: number, limit: number): Promise<{ data: Notification[]; total: number }> {
    const supabase = await createSupabaseAdminClient();
    const offset = (page - 1) * limit;

    const { data, count } = await supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    return {
      data: (data || []) as Notification[],
      total: count || 0,
    };
  }
}

export const notificationService = new NotificationService();
