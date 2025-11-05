import { supabase } from "../lib/supabase";

type PushNotificationPayload = {
  to: string;
  title: string;
  body: string;
  user_id: string;
  reference_table?: string;
  reference_row_id?: string;
};

/**
 * Sends a push notification or a batch of push notifications using Expo's push notification service.
 * It also records the notification in the database.
 * @param notifications A single notification payload or an array of notification payloads.
 *                      For bulk notifications, provide an array of up to 100 payloads.
 */
export const sendMobilePushNotification = async (
  notifications: PushNotificationPayload | PushNotificationPayload[],
) => {
  const notificationsArray = Array.isArray(notifications)
    ? notifications
    : [notifications];

  // Record notifications in the database
  const dbNotifications = notificationsArray.map((n) => ({
    title: n.title,
    message: n.body,
    user_id: n.user_id,
    reference_table: n.reference_table,
    reference_row_id: n.reference_row_id,
  }));

  if (dbNotifications.length > 0) {
    const { error } = await supabase
      .from("notifications")
      .insert(dbNotifications);
    if (error) {
      console.error("Error inserting notifications into DB:", error);
      // We might not want to stop the push notification from being sent,
      // so we just log the error and continue.
    }
  }

  // Prepare notifications for Expo by removing user_id
  const expoNotifications = notificationsArray.map(({ to, title, body }) => ({
    to,
    title,
    body,
  }));

  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(expoNotifications),
  };

  try {
    const response = await fetch(
      "https://exp.host/--/api/v2/push/send",
      options,
    );
    const responseData = await response.json();
    console.log("Push notification sent:", responseData);
  } catch (err) {
    console.error("Error sending push notification:", err);
  }
};
