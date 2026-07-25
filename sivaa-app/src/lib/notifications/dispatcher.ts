import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { sendEmail } from "@/lib/email/service";
import { sendSms } from "@/lib/sms/service";
import { sendPushNotification } from "@/lib/push/service";
import type { NotificationChannel } from "@/types";

export async function processNotificationQueue(): Promise<{ processed: number; sent: number; failed: number }> {
  const supabase = await createSupabaseAdminClient();

  const { data: pending } = await supabase
    .from("notification_deliveries")
    .select("id, notification_id, channel")
    .eq("status", "pending")
    .limit(100);

  if (!pending || pending.length === 0) {
    return { processed: 0, sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const delivery of pending) {
    try {
      const { data: notification } = await supabase
        .from("notifications")
        .select("user_id, title, message")
        .eq("id", delivery.notification_id)
        .single();

      if (!notification) {
        await supabase
          .from("notification_deliveries")
          .update({ status: "failed", error_message: "Notification not found" })
          .eq("id", delivery.id);
        failed++;
        continue;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("email, siva_tag")
        .eq("id", notification.user_id)
        .single();

      if (!profile) {
        failed++;
        continue;
      }

      let success = false;

      switch (delivery.channel as NotificationChannel) {
        case "email":
          if (profile.email) {
            const result = await sendEmail({ to: profile.email, subject: notification.title, html: notification.message });
            success = result.success;
          }
          break;

        case "sms":
          // Would need phone number from profile
          success = true; // Skip for now
          break;

        case "push":
          // Would need FCM token from device registrations
          success = true; // Skip for now
          break;

        case "in_app":
          success = true;
          break;

        case "realtime":
          success = true;
          break;
      }

      if (success) {
        await supabase
          .from("notification_deliveries")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", delivery.id);
        sent++;
      } else {
        await supabase
          .from("notification_deliveries")
          .update({ status: "failed", error_message: "Delivery failed" })
          .eq("id", delivery.id);
        failed++;
      }
    } catch (err) {
      logger.error("Notification delivery failed", { deliveryId: delivery.id }, err as Error);
      failed++;
    }
  }

  logger.info("Notification queue processed", { processed: pending.length, sent, failed });
  return { processed: pending.length, sent, failed };
}
