import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Organization } from "@/lib/types";
import { useRouter } from "expo-router";
import { getDistanceInKm } from "@/lib/location";

interface OrganizationCardProps {
  organization: Organization;
}

export default function OrganizationCard({
  organization,
}: OrganizationCardProps) {
  const router = useRouter();
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    const calculateDistance = async () => {
      const dist = await getDistanceInKm(
        organization.latitude,
        organization.longitude,
      );
      setDistance(dist);
    };
    calculateDistance();
  }, [organization.latitude, organization.longitude]);

  return (
    <TouchableOpacity
      onPress={() =>
        router.push(`/home/single-organization/${organization.id}`)
      }
      style={styles.organizationContainer}
    >
      <View style={styles.topSection}>
        {organization.logo && (
          <Image
            source={{ uri: organization.logo }}
            style={styles.organizationLogo}
          />
        )}
        <View style={styles.topRightContent}>
          <Text style={styles.organizationName}>{organization.name}</Text>
          <Text style={styles.dateText}>
            Created at: {new Date(organization.created_at).toLocaleDateString()}
          </Text>
          {distance !== null && (
            <Text style={styles.distanceText}>{distance} km away</Text>
          )}
        </View>
      </View>
      <View style={styles.bottomSection}>
        <Text style={styles.organizationAbout}>{organization.about}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  organizationContainer: {
    backgroundColor: "#fff",
    borderRadius: 5,
    marginBottom: 15,
    elevation: 0.5,
    width: "100%",
  },
  topSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  topRightContent: {
    flex: 1,
  },
  organizationLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  organizationName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  distanceText: {
    fontSize: 12,
    color: "#666",
  },
  bottomSection: {
    padding: 15,
  },
  organizationAbout: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
});
