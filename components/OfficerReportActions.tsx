import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  TextInput,
} from "react-native";
import type { Report } from "@/lib/types";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Toast from "react-native-toast-message";
import { supabase } from "@/lib/supabase";
import Styles from "@/lib/styles";
import Colors from "@/lib/colors";
import { handleReportAction, updateReportStatusAndHistory } from "@/lib/utils";
import { getStatusColor } from "@/lib/statusColors";
import Ionicons from "@expo/vector-icons/Ionicons";
import ResolveReportForm from "./ResolveReportForm";
import AssignToOrganizationModal from "./modal/AssignToOrganizationModal"; // Import the new modal
import EscalateToAgencyModal from "./modal/EscalateToAgencyModal"; // Import the new modal

const RejectFormSchema = z.object({
  reason: z
    .string()
    .min(10, { message: "Rejection reason must be at least 10 characters." }),
});

type RejectFormData = z.infer<typeof RejectFormSchema>;

interface OfficerReportActionsProps {
  report: Report;
}

export default function OfficerReportActions({
  report,
}: OfficerReportActionsProps) {
  const [loading, setLoading] = useState(false);
  const [showRejectReasonInput, setShowRejectReasonInput] = useState(false);
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [showAssignToOrganizationModal, setShowAssignToOrganizationModal] =
    useState(false); // New state for the assign modal
  const [showEscalateToAgencyModal, setShowEscalateToAgencyModal] =
    useState(false); // New state for the escalate modal

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RejectFormData>({
    resolver: zodResolver(RejectFormSchema),
    defaultValues: {
      reason: "This report does not meet the criteria for further action.",
    },
  });

  async function handleRejectReport(data: RejectFormData) {
    setLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not authenticated.");
      }

      // Insert into rejected_reports table
      const { error: rejectError } = await supabase
        .from("rejected_reports")
        .insert({
          report_id: report.id,
          reason: data.reason,
          user_id: user.id,
        });

      if (rejectError) {
        throw rejectError;
      }

      await updateReportStatusAndHistory(
        report.id,
        user.id,
        "rejected",
        data.reason,
      );
      Toast.show({
        type: "success",
        text1: "Report Rejected",
        text2:
          "Report has been successfully rejected with the provided reason.",
      });
      setShowRejectReasonInput(false);
      reset();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Rejection Error",
        text2: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  const actionButtons = [
    {
      status: "pending",
      targetStatus: "received",
      text: "Mark as Received",
      onPress: () =>
        handleReportAction(
          report,
          setLoading,
          "received",
          "Report marked as received by officer.",
        ),
    },

    {
      status: "received",
      targetStatus: "verified",
      text: "Mark as Verified",
      onPress: () =>
        handleReportAction(
          report,
          setLoading,
          "verified",
          "Report verified as legitimate by officer.",
        ),
    },
    {
      status: "received",
      targetStatus: "rejected",
      text: "Reject",
      onPress: () => setShowRejectReasonInput(true),
    },
    {
      status: "verified",
      targetStatus: "active",
      text: "Start Working",
      onPress: () =>
        handleReportAction(
          report,
          setLoading,
          "active",
          "Officer started working on the report.",
        ),
    },
    {
      status: "verified",
      targetStatus: "assigned",
      text: "Assign to Organization",
      onPress: () => setShowAssignToOrganizationModal(true),
    },
    {
      status: "verified",
      targetStatus: "escalated",
      text: "Escalate",
      onPress: () => setShowEscalateToAgencyModal(true),
    },
    {
      status: "active",
      targetStatus: "resolved",
      text: "Mark as Resolved",
      onPress: () => setShowResolveForm(true),
    },
  ];

  return (
    <View
      style={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        marginHorizontal: 20,
        // elevation: 0.5,
        // borderRadius: 5,
        // backgroundColor: Colors.white,
        // padding: 10,
        gap: 10,
      }}
    >
      {actionButtons.map((button, index) =>
        report.status === button.status ? (
          <TouchableOpacity
            key={index}
            style={{
              ...Styles.primaryButton,
              width: "auto",
              marginTop: 10,
              backgroundColor: loading
                ? "gray"
                : getStatusColor(button.targetStatus),
            }}
            onPress={button.onPress}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={"white"} />
            ) : (
              <Text style={Styles.primaryButtonText}>{button.text}</Text>
            )}
          </TouchableOpacity>
        ) : null,
      )}

      {showRejectReasonInput && (
        <View style={{ width: "100%", marginTop: 20 }}>
          <Text style={Styles.inputLabel}>Reason for Rejection</Text>
          <Controller
            control={control}
            name="reason"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={Styles.input}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="Enter reason for rejection (min 10 characters)"
                multiline
                numberOfLines={4}
              />
            )}
          />
          {errors.reason && (
            <Text style={Styles.inputError}>{errors.reason.message}</Text>
          )}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <TouchableOpacity
              style={{
                ...Styles.primaryButton,
                flex: 1,
                backgroundColor: loading ? "gray" : Colors.red,
              }}
              onPress={handleSubmit(handleRejectReport)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={"white"} />
              ) : (
                <Text style={Styles.primaryButtonText}>Submit Rejection</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                ...Styles.primaryButton,
                width: 50,
                backgroundColor: Colors.gray,
                justifyContent: "center",
                alignItems: "center",
              }}
              onPress={() => setShowRejectReasonInput(false)}
              disabled={loading}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {showResolveForm && (
        <ResolveReportForm
          report={report}
          onClose={() => setShowResolveForm(false)}
          onSuccess={() => {
            setShowResolveForm(false);
            // Optionally, add a refresh mechanism or another toast here
          }}
        />
      )}

      {showAssignToOrganizationModal && report.status === "verified" && (
        <AssignToOrganizationModal
          report={report}
          onClose={() => setShowAssignToOrganizationModal(false)}
          onAssignSuccess={() => {
            setShowAssignToOrganizationModal(false);
          }}
        />
      )}

      {showEscalateToAgencyModal && report.status === "verified" && (
        <EscalateToAgencyModal
          report={report}
          onClose={() => setShowEscalateToAgencyModal(false)}
          onEscalateSuccess={() => {
            setShowEscalateToAgencyModal(false);
            // Optionally, add a refresh mechanism or another toast here
          }}
        />
      )}
    </View>
  );
}
