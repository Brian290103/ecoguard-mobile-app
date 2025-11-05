import { supabase } from "@/lib/supabase";
import { sendMobilePushNotification } from "./sendMobilePushNotification";

export const sendResourceNotificationToUsers = async (
  title: string,
  type: string,
  resourceId: string,
) => {
  try {
    const { data: profiles, error: profileError } = await supabase
      .from("profile")
      .select("id")
      .eq("role", "user");

    if (profileError) {
      console.error(
        "Error fetching profiles for resource notification:",
        profileError,
      );
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.log("No users with role 'user' found.");
      return;
    }

    const userIds = profiles.map((p) => p.id);

    const { data: pushTokens, error: pushTokenError } = await supabase
      .from("expo_push_tokens")
      .select("token, user_id")
      .in("user_id", userIds);

    if (pushTokenError) {
      console.error(
        "Error fetching user push tokens for resource notification:",
        pushTokenError,
      );
      return;
    }

    if (pushTokens && pushTokens.length > 0) {
      const notifications = pushTokens.map((data) => ({
        to: data.token,
        title: `New Resource: ${title}`,
        body: `Type: ${type}`,
        data: {
          url: `/home/single-resource/${resourceId}`,
        },
        user_id: data.user_id,
        reference_table: "resources",
        reference_row_id: resourceId,
      }));

      await sendMobilePushNotification(notifications);
    }
  } catch (error) {
    console.error("Error in sendResourceNotificationToUsers:", error);
  }
};
