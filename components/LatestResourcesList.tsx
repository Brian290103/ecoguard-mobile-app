import React, { useEffect, useState } from "react";
import { ScrollView, View, Text, ActivityIndicator, StyleSheet } from "react-native";
import ListHeader from "@/components/ListHeader";
import { supabase } from "@/lib/supabase";
import ResourceCard from "@/components/ResourceCard";
import Colors from "@/lib/colors";
import { router } from "expo-router";

interface Resource {
  id: string;
  created_at: string;
  title: string;
  caption: string;
  poster_url: string;
  type: string;
  resource_url: string;
  user_id: string;
}

export default function LatestResourcesList() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatestResources = async () => {
      try {
        const { data, error } = await supabase
          .from("resources")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) {
          throw error;
        }
        setResources(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred while fetching resources.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLatestResources();

    const channel = supabase
      .channel("latest-resources-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "resources" },
        (payload) => {
          fetchLatestResources();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (resources.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ListHeader
        title="Latest Resources"
        linkText="View All"
        onPressLink={() => router.push("/home/resources")}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScrollContainer}
      >
        {resources.map((item) => (
          <ResourceCard key={item.id} resource={item} isDetailed={false} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    textAlign: "center",
  },
  noResourcesText: {
    textAlign: "center",
    color: Colors.gray,
  },
  horizontalScrollContainer: {
    paddingRight: 20, // Add some padding at the end of the scroll view
  },
});
