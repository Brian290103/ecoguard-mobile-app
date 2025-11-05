import Styles from "@/lib/styles";
import {
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  SectionList,
  RefreshControl,
} from "react-native";
import React, { useEffect, useState, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/lib/colors";
import CreateOrganizationModal from "@/components/modal/CreateOrganizationModal";
import { supabase } from "@/lib/supabase";
import { Organization } from "@/lib/types";
import OrganizationCard from "@/components/OrganizationCard";


interface Section {
  title: string;
  data: Organization[];
}

export default function Organizations() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);



  const fetchAndGroupOrganizations = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("organizations").select("*");
    if (error) {
      console.error("Error fetching organizations:", error);
    } else {
      const sortedOrganizations = (data || []).sort((a, b) =>
        a.name.localeCompare(b.name),
      );

      const grouped: { [key: string]: Organization[] } = {};
      sortedOrganizations.forEach((org) => {
        const firstLetter = org.name.charAt(0).toUpperCase();
        if (!grouped[firstLetter]) {
          grouped[firstLetter] = [];
        }
        grouped[firstLetter].push(org);
      });

      const newSections = Object.keys(grouped)
        .sort()
        .map((letter) => ({
          title: letter,
          data: grouped[letter],
        }));

      setSections(newSections);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAndGroupOrganizations();

    const organizationChannel = supabase
      .channel("organizations_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "organizations" },
        (payload) => {
          console.log("Change received!", payload);
          fetchAndGroupOrganizations();
        },
      )
      .subscribe();

    return () => {
      organizationChannel.unsubscribe();
    };
  }, [fetchAndGroupOrganizations]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAndGroupOrganizations();
    setRefreshing(false);
  }, [fetchAndGroupOrganizations]);

  const renderSectionHeader = ({ section: { title } }: { section: Section }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  if (loading) {
    return (
      <View style={[Styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {sections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No organizations found.</Text>
          <Text style={styles.emptyText}>Create one to get started!</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          renderItem={({ item }) => <OrganizationCard organization={item} />}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <CreateOrganizationModal />
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.gray,
    textAlign: "center",
    marginBottom: 10,
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 20,
  },
});
