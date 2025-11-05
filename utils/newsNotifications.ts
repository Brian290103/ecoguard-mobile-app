import { supabase } from "../lib/supabase";
import { sendMobilePushNotification } from "./sendMobilePushNotification";

export const sendNewsNotificationToUsers = async (
  title: string,
  caption: string,
  newsId: string,
) => {
  try {
    // Fetch all users with role 'user'
    // Fetch all user IDs with role 'user'
    const { data: profiles, error: profileError } = await supabase
      .from("profile")
      .select("id")
      .eq("role", "user");

    if (profileError) {
      console.error(
        "Error fetching profiles for news notification:",
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
        "Error fetching user push tokens for news notification:",
        pushTokenError,
      );
      return;
    }

    if (pushTokens && pushTokens.length > 0) {
      const notifications = pushTokens.map((data) => ({
        to: data.token,
        title: title,
        body: caption,
        user_id: data.user_id,
        reference_table: "news",
        reference_row_id: newsId,
      }));

      await sendMobilePushNotification(notifications);
    }
  } catch (error) {
    console.error("Error in sendNewsNotificationToUsers:", error);
  }
};
