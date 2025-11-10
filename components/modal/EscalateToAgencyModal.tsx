import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
} from "react-native";
import { supabase } from "@/lib/supabase";
import Colors from "@/lib/colors";
import Styles from "@/lib/styles";
import { Report } from "@/lib/types";
import Toast from "react-native-toast-message";
import { updateReportStatusAndHistory } from "@/lib/utils";
import { findRelevantAgencies } from "@/lib/qdrantActions/agenciesQdrantActions";

interface Agency {
  id: string;
  name: string;
  logo: string;
  similarity: number;
}

interface EscalateToAgencyModalProps {
  report: Report;
  onClose: () => void;
  onEscalateSuccess: () => void;
}

export default function EscalateToAgencyModal({
  report,
  onClose,
  onEscalateSuccess,
}: EscalateToAgencyModalProps) {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [escalating, setEscalating] = useState(false);
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    async function fetchAgencies() {
      setLoading(true);
      if (!report || !report.id) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Report ID is missing.",
        });
        setLoading(false);
        return;
      }

      const relevantAgencies = await findRelevantAgencies(report.description);
      console.log({ relevantAgencies });
      if (relevantAgencies) {
        setAgencies(relevantAgencies);
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to load relevant agencies.",
        });
        setAgencies([]);
      }
      setLoading(false);
    }

    fetchAgencies();
  }, [report]);

  const handleEscalate = async () => {
    if (!selectedAgencyId) {
      Toast.show({
        type: "info",
        text1: "Selection Required",
        text2: "Please select an agency to escalate the report to.",
      });
      return;
    }

    setEscalating(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not authenticated.");
      }

      const { error: updateError } = await updateReportStatusAndHistory(
        report.id,
        user.id,
        "escalated",
        `Report escalated to agency: ${
          agencies.find((agency) => agency.id === selectedAgencyId)?.name
        }`,
        null, // organization_id is null for agency escalation
        selectedAgencyId, // Pass the agency ID here
      );

      if (updateError) {
        console.error("Error updating report status:", updateError);
        throw new Error("Failed to update report status.");
      }

      // Record the escalation in the escalated_reports table
      const { error: insertError } = await supabase
        .from("escalated_reports")
        .insert({
          report_id: report.id,
          agency_id: selectedAgencyId,
          user_id: user.id,
        });

      if (insertError) {
        console.error("Error inserting into escalated_reports:", insertError);
        throw new Error("Failed to record report escalation.");
      }

      Toast.show({
        type: "success",
        text1: "Report Escalated",
        text2: "Report successfully escalated to the selected agency.",
      });
      onEscalateSuccess();
    } catch (error: any) {
      console.error("Error escalating report:", error);
      Toast.show({
        type: "error",
        text1: "Escalation Failed",
        text2: error.message,
      });
    } finally {
      setEscalating(false);
    }
  };

  const renderAgencyCard = ({ item }: { item: Agency }) => (
    <TouchableOpacity
      style={[
        localStyles.agencyCard,
        selectedAgencyId === item.id && localStyles.selectedCard,
      ]}
      onPress={() => setSelectedAgencyId(item.id)}
    >
      <Image source={{ uri: item.logo }} style={localStyles.agencyLogo} />
      <View style={localStyles.agencyInfo}>
        <Text style={localStyles.agencyName}>{item.name}</Text>
        <Text style={localStyles.similarityText}>
          Similarity: {(item.similarity * 100).toFixed(2)}%
        </Text>
      </View>
      <View
        style={[
          localStyles.radioButton,
          selectedAgencyId === item.id
            ? { backgroundColor: Colors.primary }
            : {
                backgroundColor: Colors.white,
                borderColor: Colors.gray,
                borderWidth: 1,
              },
        ]}
      />
    </TouchableOpacity>
  );

  return (
    <View style={localStyles.modalContainer}>
      <Text style={localStyles.modalTitle}>Select Agency</Text>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} />
      ) : agencies.length === 0 ? (
        <Text style={localStyles.noAgenciesText}>
          No relevant agencies found.
        </Text>
      ) : (
        <FlatList
          scrollEnabled={false}
          data={agencies}
          renderItem={renderAgencyCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={localStyles.listContent}
        />
      )}

      <View style={localStyles.buttonContainer}>
        <TouchableOpacity
          style={[
            Styles.primaryButton,
            localStyles.escalateButton,
            (!selectedAgencyId || escalating) && {
              backgroundColor: Colors.gray,
            },
          ]}
          onPress={handleEscalate}
          disabled={!selectedAgencyId || escalating}
        >
          {escalating ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={Styles.primaryButtonText}>Escalate</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[Styles.outlineButton, localStyles.cancelButton]}
          onPress={onClose}
          disabled={escalating}
        >
          <Text style={Styles.outlineButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  modalContainer: {
    marginTop: 10,
    padding: 20,
    backgroundColor: Colors.lightGray,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: Colors.gray,
    elevation: 0.5,
    width: "100%",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: Colors.primary,
  },
  listContent: {
    paddingBottom: 10,
  },
  agencyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 0.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    borderColor: Colors.white,
    borderWidth: 2,
  },
  selectedCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  agencyLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: Colors.lightGray, // Placeholder background
  },
  agencyInfo: {
    flex: 1,
  },
  agencyName: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.gray,
  },
  similarityText: {
    fontSize: 12,
    color: Colors.darkGray,
    marginTop: 2,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginLeft: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 10,
  },
  escalateButton: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
  },
  noAgenciesText: {
    textAlign: "center",
    color: Colors.gray,
    fontSize: 16,
    marginVertical: 20,
  },
});
