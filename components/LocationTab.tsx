import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Report } from "@/lib/types";
import React, { useEffect, useState } from "react";
import { getDistanceInKm } from "@/lib/location";
import Colors from "@/lib/colors";

// import { GoogleMaps, AppleMaps } from "expo-maps";

interface LocationTabProps {
  report: Report;
}

export default function LocationTab({ report }: LocationTabProps) {
  const [distance, setDistance] = useState<number | null>(null);
  const [loadingDistance, setLoadingDistance] = useState(true);

  useEffect(() => {
    const fetchDistance = async () => {
      setLoadingDistance(true);
      const dist = await getDistanceInKm(report.latitude, report.longitude);
      setDistance(dist);
      setLoadingDistance(false);
    };

    fetchDistance();
  }, [report.latitude, report.longitude]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Latitude:</Text>
      <Text style={styles.value}>{report.latitude}</Text>

      <Text style={styles.label}>Longitude:</Text>
      <Text style={styles.value}>{report.longitude}</Text>

      <Text style={styles.label}>Distance from you:</Text>
      {loadingDistance ? (
        <ActivityIndicator size="small" color={Colors.primary} />
      ) : distance !== null ? (
        <Text style={styles.value}>{distance} km away</Text>
      ) : (
        <Text style={styles.value}>N/A</Text>
      )}

      {/*{Platform.OS === "ios" && <AppleMaps.View style={{ flex: 1 }} />}*/}
      {/*{Platform.OS === "android" && <GoogleMaps.View style={{ flex: 1 }} />}*/}
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
