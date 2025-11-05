import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import Colors from "@/lib/colors";
import { supabase } from "@/lib/supabase";
import type { Organization } from "@/lib/types";
import OrganizationLocationTab from "@/components/OrganizationLocationTab";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function OrganizationDetails() {
  const { organizationId } = useLocalSearchParams();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"location">("location");

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!organizationId || typeof organizationId !== "string") {
          setError("Invalid Organization ID provided.");
          setLoading(false);
          return;
        }

        const { data: organizationData, error: organizationError } =
          await supabase
            .from("organizations")
            .select("*")
            .eq("id", organizationId)
            .single();

        if (organizationError) {
          throw organizationError;
        }
        setOrganization(organizationData);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("An unknown error occurred.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (organizationId) {
      fetchData();
    }

    // Set up real-time subscription
    const organizationSubscription = supabase
      .channel(`organization:${organizationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "organizations",
          filter: `id=eq.${organizationId}`,
        },
        (payload) => {
          setOrganization(payload.new as Organization);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(organizationSubscription);
    };
  }, [organizationId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (!organization) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFoundText}>Organization not found.</Text>
      </View>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "location":
        return <OrganizationLocationTab organization={organization} />;
      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: organization.name }} />

      <View style={styles.logoContainer}>
        {organization.logo && (
          <Image source={{ uri: organization.logo }} style={styles.logo} />
        )}
      </View>

      <Text style={styles.organizationName}>{organization.name}</Text>
      <Text style={styles.organizationAbout}>{organization.about}</Text>

      <View style={styles.detailRow}>
        <Text style={styles.label}>Created At:</Text>
        <Text style={styles.value}>
          {new Date(organization.created_at).toLocaleString()}
        </Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.label}>Last Updated:</Text>
        <Text style={styles.value}>
          {new Date(organization.updated_at).toLocaleString()}
        </Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "location" && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab("location")}
        >
          <Ionicons
            name="location"
            size={20}
            color={activeTab === "location" ? Colors.primary : "#666"}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === "location" && styles.activeTabButtonText,
            ]}
          >
            Location
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContent}>{renderTabContent()}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
  },
  logoContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#eee",
  },
  organizationName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
    paddingHorizontal: 20,
    paddingTop: 20,
    textAlign: "center",
  },
  organizationAbout: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 24,
    color: "#555",
    paddingHorizontal: 20,
    textAlign: "center",
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    marginRight: 5,
    color: "#333",
  },
  value: {
    fontSize: 14,
    color: "#666",
    flexShrink: 1,
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
  },
  notFoundText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
    marginTop: 20,
  },
  tabButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#666",
  },
  activeTabButtonText: {
    color: Colors.primary,
  },
  tabContent: {
    flex: 1,
  },
});
