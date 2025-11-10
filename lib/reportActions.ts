import { supabase } from "./supabase";
import Toast from "react-native-toast-message";
import type { ReportStatus } from "./types";
import { sendMobilePushNotification } from "../utils/sendMobilePushNotification";

export const updateReportStatusAndHistory = async (
  reportId: string,
  userId: string,
  newStatus: ReportStatus,
  notes: string,
  organizationId?: string, // Added optional parameter
  agencyId?: string, // Added optional parameter
) => {
  try {
    // Get the report creator's user ID and report number
    const { data: reportData, error: reportError } = await supabase
      .from("reports")
      .select("user_id, report_number")
      .eq("id", reportId)
      .single();

    if (reportError || !reportData) {
      throw new Error("Report not found or error fetching report creator.");
    }

    const { user_id: reportCreatorId, report_number: reportNumber } =
      reportData;

    // Prepare update object for reports table
    const updateObject: { status: ReportStatus } = {
      status: newStatus,
    };

    // Update report status
    const { error: updateError } = await supabase
      .from("reports")
      .update(updateObject)
      .eq("id", reportId);

    if (updateError) {
      throw updateError;
    }

    // Add to report history
    const { error: historyError } = await supabase
      .from("report_history")
      .insert({
        report_id: reportId,
        user_id: userId,
        notes: notes,
        status: newStatus,
      });

    if (historyError) {
      throw historyError;
    }

    // Send notification to agency reps if a report is escalated
    if (newStatus === "escalated" && agencyId) {
      const { data: reps, error: repsError } = await supabase
        .from("agency_reps")
        .select("user_id")
        .eq("agency_id", agencyId)
        .eq("is_approved", true);

      if (repsError) {
        console.error("Error fetching agency reps:", repsError);
      } else if (reps && reps.length > 0) {
        const repUserIds = reps.map((r) => r.user_id);
        const { data: tokens, error: tokensError } = await supabase
          .from("expo_push_tokens")
          .select("token, user_id")
          .in("user_id", repUserIds);

        if (tokensError) {
          console.error(
            "Error fetching push tokens for agency reps:",
            tokensError,
          );
        } else if (tokens && tokens.length > 0) {
          const notifications = tokens.map((t) => ({
            to: t.token,
            title: "New Report Escalated",
            body: `A new report #${reportNumber} has been escalated to your agency.`,
            user_id: t.user_id,
            reference_table: "reports",
            reference_row_id: reportId,
          }));
          await sendMobilePushNotification(notifications);
        }
      }
    }

    // Send notification to organization reps if a report is assigned
    if (newStatus === "assigned" && organizationId) {
      const { data: reps, error: repsError } = await supabase
        .from("org_reps")
        .select("user_id")
        .eq("org_id", organizationId)
        .eq("is_approved", true);

      if (repsError) {
        console.error("Error fetching organization reps:", repsError);
      } else if (reps && reps.length > 0) {
        const repUserIds = reps.map((r) => r.user_id);
        const { data: tokens, error: tokensError } = await supabase
          .from("expo_push_tokens")
          .select("token, user_id")
          .in("user_id", repUserIds);

        if (tokensError) {
          console.error(
            "Error fetching push tokens for org reps:",
            tokensError,
          );
        } else if (tokens && tokens.length > 0) {
          const notifications = tokens.map((t) => ({
            to: t.token,
            title: "New Report Assigned",
            body: `A new report #${reportNumber} has been assigned to your organization.`,
            user_id: t.user_id,
            reference_table: "reports",
            reference_row_id: reportId,
          }));
          await sendMobilePushNotification(notifications);
        }
      }
    }

    // Send notification to the report creator
    if (reportCreatorId) {
      const { data: tokenData, error: tokenError } = await supabase
        .from("expo_push_tokens")
        .select("token")
        .eq("user_id", reportCreatorId);

      if (tokenError) {
        console.error(
          "Error fetching push token for report creator:",
          tokenError,
        );
      } else if (tokenData && tokenData.length > 0) {
        const notifications = tokenData.map((t) => ({
          to: t.token,
          title: `Report Status Updated`,
          body: `The status of your report #${reportNumber} has been updated to ${newStatus}.`,
          user_id: reportCreatorId,
          reference_table: "reports",
          reference_row_id: reportId,
        }));
        await sendMobilePushNotification(notifications);
      }
    }

    Toast.show({
      type: "success",
      text1: "Success",
      text2: `Report status updated to ${newStatus}.`,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message,
      });
    } else {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "An unknown error occurred.",
      });
    }
    return { success: false, error };
  }
};
