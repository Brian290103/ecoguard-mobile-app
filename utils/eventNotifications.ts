import { supabase } from "@/lib/supabase";
import { sendMobilePushNotification } from "./sendMobilePushNotification";

export const sendEventNotificationToUsers = async (
  title: string,
  location: string,
  eventId: string,
) => {
  try {
    // Fetch all user IDs with role 'user'
    const { data: profiles, error: profileError } = await supabase
      .from("profile")
      .select("id")
      .eq("role", "user");

    if (profileError) {
      console.error(
        "Error fetching profiles for event notification:",
        profileError,
      );
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.log("No users with role 'user' found.");
      return;
    }

    const userIds = profiles.map((p) => p.id);

    // Fetch push tokens for these user IDs
    const { data: pushTokens, error: pushTokenError } = await supabase
      .from("expo_push_tokens")
      .select("token, user_id")
      .in("user_id", userIds);

    if (pushTokenError) {
      console.error(
        "Error fetching user push tokens for event notification:",
        pushTokenError,
      );
      return;
    }

    if (pushTokens && pushTokens.length > 0) {
      const notifications = pushTokens.map((data) => ({
        to: data.token,
        title: `New Event: ${title}`,
        body: `Location: ${location}`,
        data: {
          url: `/home/single-event/${eventId}`,
        },
        user_id: data.user_id,
        reference_table: "events",
        reference_row_id: eventId,
      }));

      await sendMobilePushNotification(notifications);
    }
  } catch (error) {
    console.error("Error in sendEventNotificationToUsers:", error);
  }
};
