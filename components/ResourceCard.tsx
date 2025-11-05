import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from "react-native";
import Colors from "@/lib/colors";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { getAbbreviation } from "@/lib/utils";

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

interface OrganizationProfile {
  name: string;
  logo: string | null;
}

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  avatar: string | null;
  role: string;
}

interface ResourceCardProps {
  resource: Resource;
  isDetailed?: boolean;
}

export default function ResourceCard({
  resource,
  isDetailed = false,
}: ResourceCardProps) {
  const [organizationProfile, setOrganizationProfile] =
    useState<OrganizationProfile | null>(null);
  const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const handlePress = async () => {
    if (resource.resource_url) {
      const supported = await Linking.canOpenURL(resource.resource_url);
      if (supported) {
        await Linking.openURL(resource.resource_url);
      } else {
        console.warn(
          `Don't know how to open this URL: ${resource.resource_url}`,
        );
      }
    }
  };

  useEffect(() => {
    const fetchAuthorDetails = async () => {
      if (!isDetailed || !resource.user_id) {
        setLoading(false);
        return;
      }
      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profile")
          .select("id, first_name, last_name, avatar, role")
          .eq("id", resource.user_id)
          .single();

        if (profileError) {
          throw profileError;
        }

        if (profileData) {
          setAuthorProfile(profileData as UserProfile);

          if (profileData.role === "org") {
            const { data: orgData, error: orgError } = await supabase
              .from("org_reps")
              .select("organization:organizations (name, logo)")
              .eq("user_id", resource.user_id)
              .limit(1);

            if (orgError) {
              throw orgError;
            }

            if (orgData && orgData.length > 0 && orgData[0].organization) {
              setOrganizationProfile(
                orgData[0].organization as OrganizationProfile,
              );
            }
          }
        }
      } catch (error) {
        console.error("Error fetching author details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthorDetails();
  }, [isDetailed, resource.user_id]);

  const renderAuthor = () => {
    if (loading) {
      return <ActivityIndicator size="small" color={Colors.gray} />;
    }

    if (!authorProfile) {
      return <Text style={styles.authorName}>Author Unknown</Text>;
    }

    if (authorProfile.role === "org" && organizationProfile) {
      return (
        <View style={styles.authorContainer}>
          {organizationProfile.logo ? (
            <Image
              source={{ uri: organizationProfile.logo }}
              style={styles.authorAvatar}
            />
          ) : (
            <View style={styles.authorAvatarPlaceholder}>
              <Text style={styles.authorAvatarText}>
                {getAbbreviation(
                  organizationProfile.name.split(" ")[0],
                  organizationProfile.name.split(" ").slice(1).join(" "),
                )}
              </Text>
            </View>
          )}
          <Text style={styles.authorName}>{organizationProfile.name}</Text>
        </View>
      );
    }

    if (authorProfile.role === "officer" || authorProfile.role === "user") {
      return (
        <View style={styles.authorContainer}>
          {authorProfile.avatar ? (
            <Image
              source={{ uri: authorProfile.avatar }}
              style={styles.authorAvatar}
            />
          ) : (
            <View style={styles.authorAvatarPlaceholder}>
              <Text style={styles.authorAvatarText}>
                {getAbbreviation(
                  authorProfile.first_name,
                  authorProfile.last_name,
                )}
              </Text>
            </View>
          )}
          <Text style={styles.authorName}>
            {authorProfile.first_name} {authorProfile.last_name}
          </Text>
        </View>
      );
    }

    return <Text style={styles.authorName}>Author Unknown</Text>;
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={
        isDetailed
          ? styles.resourceContainer
          : styles.resourceContainerHorizontal
      }
    >
      {resource.poster_url && (
        <Image
          source={{ uri: resource.poster_url }}
          style={
            isDetailed ? styles.resourceImage : styles.resourceImageHorizontal
          }
        />
      )}
      <View
        style={isDetailed ? styles.centerView : styles.centerViewHorizontal}
      >
        <Text
          style={
            isDetailed ? styles.resourceTitle : styles.resourceTitleHorizontal
          }
        >
          {resource.title}
        </Text>
        {!isDetailed && (
          <Text style={styles.resourceTypeHorizontal}>{resource.type}</Text>
        )}
      </View>
      {isDetailed && (
        <View style={styles.bottomView}>
          <Text style={styles.resourceInfo}>
            <Ionicons
              name="information-circle-outline"
              size={14}
              color={Colors.gray}
            />{" "}
            {resource.type}
          </Text>
          <Text style={styles.descriptionText}>{resource.caption}</Text>
          <Text style={styles.dateText}>
            Created at: {new Date(resource.created_at).toLocaleDateString()}
          </Text>
          {renderAuthor()}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  resourceContainer: {
    backgroundColor: "#fff",
    borderRadius: 5,
    marginBottom: 15,
    elevation: 0.5,
    width: "100%",
  },
  topView: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
  },
  resourceImage: {
    width: 80,
    height: 80,
    borderRadius: 5,
    margin: 15,
    resizeMode: "cover",
  },
  centerView: {
    flex: 1,
    marginHorizontal: 15,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  resourceInfo: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    fontSize: 12,
    color: "#666",
  },
  bottomView: {
    paddingHorizontal: 15,
    paddingBottom: 15,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    marginTop: 10,
    paddingTop: 10,
  },
  descriptionText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 10,
  },
  authorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  authorAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  authorAvatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.primary,
    marginRight: 10,
  },
  authorAvatarText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "bold",
  },
  authorName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  resourceContainerHorizontal: {
    backgroundColor: "#fff",
    borderRadius: 5,
    elevation: 0.5,
    width: 150, // Fixed width for horizontal cards
    marginRight: 10,
    padding: 10,
    alignItems: "center",
  },
  resourceImageHorizontal: {
    width: "100%",
    height: 90,
    borderRadius: 5,
    resizeMode: "cover",
    marginBottom: 5,
  },
  centerViewHorizontal: {
    alignItems: "center",
  },
  resourceTitleHorizontal: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  resourceTypeHorizontal: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 2,
  },
});
