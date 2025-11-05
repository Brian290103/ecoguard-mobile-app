import { supabase } from "@/lib/supabase";
import { sendMobilePushNotification } from "./sendMobilePushNotification";

export const sendCommunityNotificationToUsers = async (
  name: string,
  communityId: string,
) => {
  try {
    const { data: profiles, error: profileError } = await supabase
      .from("profile")
      .select("id")
      .eq("role", "user");

    if (profileError) {
      console.error(
        "Error fetching profiles for community notification:",
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
        "Error fetching user push tokens for community notification:",
        pushTokenError,
      );
      return;
    }

    if (pushTokens && pushTokens.length > 0) {
      const notifications = pushTokens.map((data) => ({
        to: data.token,
        title: `New Community: ${name}`,
        body: `A new community has been created. Check it out!`,
        data: {
          url: `/home/single-community/${communityId}`,
        },
        user_id: data.user_id,
        reference_table: "community",
        reference_row_id: communityId,
      }));

      await sendMobilePushNotification(notifications);
    }
  } catch (error) {
    console.error("Error in sendCommunityNotificationToUsers:", error);
  }
};
