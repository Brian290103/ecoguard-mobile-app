import { supabase } from "../lib/supabase";
import { sendMobilePushNotification } from "./sendMobilePushNotification";

export const sendReportNotificationToOfficers = async (
  reportTitle: string,
  reportId: string,
) => {
  try {
    // 1. Fetch all officers
    const { data: officers, error: officersError } = await supabase
      .from("profile")
      .select("id")
      .eq("role", "officer");

    if (officersError) {
      console.error("Error fetching officers:", officersError);
      return;
    }

    if (!officers || officers.length === 0) {
      console.log("No officers found to notify.");
      return;
    }

    const officerIds = officers.map((o) => o.id);

    // 2. Fetch push tokens for these officers
    const { data: tokens, error: tokensError } = await supabase
      .from("expo_push_tokens")
      .select("token, user_id")
      .in("user_id", officerIds);

    if (tokensError) {
      console.error("Error fetching push tokens:", tokensError);
      return;
    }

    if (!tokens || tokens.length === 0) {
      console.log("No push tokens found for officers.");
      return;
    }

    // 3. Construct notification payloads
    const notifications = tokens.map(({ token, user_id }) => ({
      to: token,
      title: "New Report Submitted",
      body: `A new report has been submitted: ${reportTitle}`,
      user_id,
      reference_table: "reports",
      reference_row_id: reportId,
    }));

    // 4. Send notifications
    await sendMobilePushNotification(notifications);
    console.log("Notifications sent to officers.");

  } catch (error) {
    console.error("Failed to send report notifications to officers:", error);
  }
};