import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Organization } from "@/lib/types";
import React, { useEffect, useState } from "react";
import { getDistanceInKm } from "@/lib/location";
import Colors from "@/lib/colors";

interface OrganizationLocationTabProps {
  organization: Organization;
}

export default function OrganizationLocationTab({
  organization,
}: OrganizationLocationTabProps) {
  const [distance, setDistance] = useState<number | null>(null);
  const [loadingDistance, setLoadingDistance] = useState(true);

  useEffect(() => {
    const fetchDistance = async () => {
      setLoadingDistance(true);
      const dist = await getDistanceInKm(
        organization.latitude,
        organization.longitude,
      );
      setDistance(dist);
      setLoadingDistance(false);
    };

    fetchDistance();
  }, [organization.latitude, organization.longitude]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Latitude:</Text>
      <Text style={styles.value}>{organization.latitude}</Text>

      <Text style={styles.label}>Longitude:</Text>
      <Text style={styles.value}>{organization.longitude}</Text>

      <Text style={styles.label}>Distance from you:</Text>
      {loadingDistance ? (
        <ActivityIndicator size="small" color={Colors.primary} />
      ) : distance !== null ? (
        <Text style={styles.value}>{distance} km away</Text>
      ) : (
        <Text style={styles.value}>N/A</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 8,
  },
  value: {
    fontSize: 16,
    marginBottom: 4,
  },
});