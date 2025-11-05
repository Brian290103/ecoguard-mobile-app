import { View, Text, StyleSheet, Image, ActivityIndicator } from "react-native";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import Styles from "@/lib/styles";
import { ScrollView } from "react-native-gesture-handler";

const ResourceDetails = () => {
  const { resourceId } = useLocalSearchParams();
  const [resource, setResource] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (resourceId) {
      const fetchResource = async () => {
        const { data, error } = await supabase
          .from("resources")
          .select("*, profiles(full_name)")
          .eq("id", resourceId)
          .single();

        if (error) {
          console.error("Error fetching resource:", error);
        } else {
          setResource(data);
        }
        setLoading(false);
      };

      fetchResource();
    }
  }, [resourceId]);

  if (loading) {
    return (
      <View style={Styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!resource) {
    return (
      <View style={Styles.container}>
        <Text>Resource not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: resource.poster_url }} style={styles.poster} />
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{resource.title}</Text>
        <Text style={styles.caption}>{resource.caption}</Text>
        <Text style={styles.author}>By: {resource.profiles.full_name}</Text>
        <Text style={styles.type}>Type: {resource.type}</Text>
        <Text style={styles.url}>URL: {resource.resource_url}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  poster: {
    width: "100%",
    height: 250,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  caption: {
    fontSize: 16,
    marginBottom: 10,
  },
  author: {
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: 10,
  },
  type: {
    fontSize: 14,
    marginBottom: 10,
  },
  url: {
    fontSize: 14,
    color: "blue",
  },
});

export default ResourceDetails;
