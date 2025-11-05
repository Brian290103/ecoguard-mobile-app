import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  TextInput,
} from "react-native";
import { supabase } from "@/lib/supabase";
import Colors from "@/lib/colors";
import Styles from "@/lib/styles";
import { Organization } from "@/lib/types";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";

interface OrganizationSelectionProps {
  onSelectionSuccess: () => void;
}

export default function OrganizationSelection({
  onSelectionSuccess,
}: OrganizationSelectionProps) {
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState<
    Organization[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<
    string | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchOrganizations() {
      setLoading(true);
      const { data, error } = await supabase.from("organizations").select("*");
      if (error) {
        console.error("Error fetching organizations:", error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to load organizations.",
        });
      } else {
        setAllOrganizations(data || []);
        setFilteredOrganizations(data || []); // Initialize filtered with all organizations
      }
      setLoading(false);
    }

    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const filtered = allOrganizations.filter(
        (org) =>
          org.name.toLowerCase().includes(lowerCaseQuery) ||
          org.about.toLowerCase().includes(lowerCaseQuery),
      );
      setFilteredOrganizations(filtered);
    } else {
      setFilteredOrganizations(allOrganizations);
    }
  }, [searchQuery, allOrganizations]);

  const handleSubmitSelection = async () => {
    if (!selectedOrganizationId) {
      Toast.show({
        type: "info",
        text1: "Selection Required",
        text2: "Please select an organization to represent.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not authenticated.");
      }

      const { error: insertError } = await supabase.from("org_reps").insert({
        user_id: user.id,
        org_id: selectedOrganizationId,
        is_approved: false, // Initially not approved
      });

      if (insertError) {
        console.error("Error inserting into org_reps:", insertError);
        throw new Error("Failed to submit organization selection.");
      }

      Toast.show({
        type: "success",
        text1: "Selection Submitted",
        text2:
          "Your request to represent the organization has been submitted for approval.",
      });
      onSelectionSuccess();
    } catch (error: any) {
      console.error("Error submitting selection:", error);
      Toast.show({
        type: "error",
        text1: "Submission Failed",
        text2: error.message,
      });
    } finally {
      setSubmitting(false);
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
        <Text style={localStyles.organizationAbout}>{item.about}</Text>
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
    <View style={localStyles.container}>
      <Text style={localStyles.title}>Select Your Organization</Text>
      <Text style={localStyles.subtitle}>
        Please choose the organization you represent. Your selection will be
        submitted for approval.
      </Text>

      <View style={localStyles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={Colors.gray} />
        <TextInput
          style={localStyles.searchInput}
          placeholder="Search organizations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons
              name="close-circle"
              size={20}
              color={Colors.gray}
              style={{ marginLeft: 5 }}
            />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} />
      ) : filteredOrganizations.length === 0 ? (
        <Text style={localStyles.emptyText}>No organizations found.</Text>
      ) : (
        <FlatList
          data={filteredOrganizations}
          renderItem={renderOrganizationCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={localStyles.listContent}
        />
      )}

      <TouchableOpacity
        style={[
          Styles.primaryButton,
          localStyles.submitButton,
          (!selectedOrganizationId || submitting) && {
            backgroundColor: Colors.gray,
          },
        ]}
        onPress={handleSubmitSelection}
        disabled={!selectedOrganizationId || submitting}
      >
        {submitting ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <Text style={Styles.primaryButtonText}>Submit Selection</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: Colors.primary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: "center",
    marginBottom: 20,
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
  organizationAbout: {
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
  submitButton: {
    marginTop: 20,
    width: "100%",
  },
  emptyText: {
    textAlign: "center",
    color: Colors.gray,
    fontSize: 16,
    marginVertical: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    elevation: 0.5,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
  },
});
