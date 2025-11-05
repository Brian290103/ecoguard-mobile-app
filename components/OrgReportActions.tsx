import { Button, View, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import type { Report } from "@/lib/types";
import { useState } from "react";
import ResolveReportForm from "./ResolveReportForm";
import Styles from "@/lib/styles";
import { getStatusColor } from "@/lib/statusColors";

interface OrgReportActionsProps {
  report: Report;
}

export default function OrgReportActions({ report }: OrgReportActionsProps) {
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [loading, setLoading] = useState(false); // Added loading state for consistency

  const actionButtons = [
    {
      status: "assigned",
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
    </View>
  );
}
