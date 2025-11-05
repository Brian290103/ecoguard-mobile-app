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
import { fa } from "zod/v4/locales";
import { findRelevantOrganizations } from "@/lib/qdrantActions/organizationQdrantActions";

interface Organization {
  id: string;
  name: string;
  logo: string;
  similarity: number;
}

interface AssignToOrganizationModalProps {
  report: Report;
  onClose: () => void;
  onAssignSuccess: () => void;
}

export default function AssignToOrganizationModal({
  report,
  onClose,
  onAssignSuccess,
}: AssignToOrganizationModalProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<
    string | null
  >(null);

  useEffect(() => {
    async function fetchOrganizations() {
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

      const relevantOrgs = await findRelevantOrganizations(report.description);
      console.log({ relevantOrgs });
      if (relevantOrgs) {
        setOrganizations(relevantOrgs);
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to load relevant organizations.",
        });
        setOrganizations([]);
      }
      setLoading(false);
    }

    fetchOrganizations();
  }, [report]);

  const handleAssign = async () => {
    if (!selectedOrganizationId) {
      Toast.show({
        type: "info",
        text1: "Selection Required",
        text2: "Please select an organization to assign the report to.",
      });
      return;
    }

    setAssigning(true);
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
        "assigned",
        `Report assigned to organization: ${
          organizations.find((org) => org.id === selectedOrganizationId)?.name
        }`,
        selectedOrganizationId, // Pass the organization ID here
      );

      if (updateError) {
        console.error("Error updating report status:", updateError);
        throw new Error("Failed to update report status.");
      }

      // Record the assignment in the assigned_reports table
      const { error: insertError } = await supabase
        .from("assigned_reports")
        .insert({
          report_id: report.id,
          organization_id: selectedOrganizationId,
          user_id: user.id,
        });

      if (insertError) {
        console.error("Error inserting into assigned_reports:", insertError);
        throw new Error("Failed to record report assignment.");
      }

      Toast.show({
        type: "success",
        text1: "Report Assigned",
        text2: "Report successfully assigned to the selected organization.",
      });
      onAssignSuccess();
    } catch (error: any) {
      console.error("Error assigning report:", error);
      Toast.show({
        type: "error",
        text1: "Assignment Failed",
        text2: error.message,
      });
    } finally {
      setAssigning(false);
    }
  };

  const renderOrganizationCard = ({ item }: { item: Organization }) => (
    <TouchableOpacity
      style={[
        localStyles.organizationCard,
        selectedOrganizationId === item.id && localStyles.selectedCard,
      ]}
      onPress={() => setSelectedOrganizationId(item.id)}
    >
      <Image source={{ uri: item.logo }} style={localStyles.organizationLogo} />
      <View style={localStyles.organizationInfo}>
        <Text style={localStyles.organizationName}>{item.name}</Text>
        <Text style={localStyles.similarityText}>
          Similarity: {(item.similarity * 100).toFixed(2)}%
        </Text>
      </View>
      <View
        style={[
          localStyles.radioButton,
          selectedOrganizationId === item.id
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
      <Text style={localStyles.modalTitle}>Select Organization</Text>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} />
      ) : organizations.length === 0 ? (
        <Text style={localStyles.noOrganizationsText}>
          No relevant organizations found.
        </Text>
      ) : (
        <FlatList
          scrollEnabled={false}
          data={organizations}
          renderItem={renderOrganizationCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={localStyles.listContent}
        />
      )}

      <View style={localStyles.buttonContainer}>
        <TouchableOpacity
          style={[
            Styles.primaryButton,
            localStyles.assignButton,
            (!selectedOrganizationId || assigning) && {
              backgroundColor: Colors.gray,
            },
          ]}
          onPress={handleAssign}
          disabled={!selectedOrganizationId || assigning}
        >
          {assigning ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={Styles.primaryButtonText}>Assign</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[Styles.outlineButton, localStyles.cancelButton]}
          onPress={onClose}
          disabled={assigning}
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
  organizationCard: {
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
  organizationLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: Colors.lightGray, // Placeholder background
  },
  organizationInfo: {
    flex: 1,
  },
  organizationName: {
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
  assignButton: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
  },
  noOrganizationsText: {
    textAlign: "center",
    color: Colors.gray,
    fontSize: 16,
    marginVertical: 20,
  },
});
