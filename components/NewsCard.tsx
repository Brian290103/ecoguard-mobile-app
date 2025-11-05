import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { getAbbreviation } from "@/lib/utils";
import Colors from "@/lib/colors";

interface News {
  id: string;
  created_at: string;
  title: string;
  description: string;
  caption: string;
  poster_url: string;
  updated_at: string;
  user_id: string;
}

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  avatar: string | null;
}

interface NewsCardProps {
  news: News;
  isDetailed?: boolean;
}

export default function NewsCard({ news, isDetailed = false }: NewsCardProps) {
  const router = useRouter();
  const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(null);
  const [loadingAuthor, setLoadingAuthor] = useState(true);

  useEffect(() => {
    const fetchAuthorProfile = async () => {
      if (!isDetailed || !news.user_id) {
        setLoadingAuthor(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("profile")
          .select("id, first_name, last_name, avatar")
          .eq("id", news.user_id)
          .single();

        if (error) {
          throw error;
        }
        setAuthorProfile(data as UserProfile);
      } catch (error) {
        console.error("Error fetching author profile:", error);
      } finally {
        setLoadingAuthor(false);
      }
    };

    fetchAuthorProfile();
  }, [isDetailed, news.user_id]);

  return (
    <TouchableOpacity
      onPress={() => router.push(`/home/single-news/${news.id}`)}
      style={isDetailed ? styles.newsContainer : styles.newsContainerHorizontal}
    >
      {news.poster_url && (
        <Image
          source={{ uri: news.poster_url }}
          style={isDetailed ? styles.newsImage : styles.newsImageHorizontal}
        />
      )}
      <View
        style={isDetailed ? styles.centerView : styles.centerViewHorizontal}
      >
        <Text
          style={isDetailed ? styles.newsTitle : styles.newsTitleHorizontal}
        >
          {news.title}
        </Text>
        {isDetailed && <Text style={styles.captionText}>{news.caption}</Text>}
      </View>

      {isDetailed && (
        <View style={styles.bottomView}>
          <Text style={styles.descriptionText}>{news.description}</Text>
          <Text style={styles.dateText}>
            Created at: {new Date(news.created_at).toLocaleDateString()}
          </Text>
          {loadingAuthor ? (
            <ActivityIndicator size="small" color={Colors.gray} />
          ) : authorProfile ? (
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
          ) : (
            <Text style={styles.authorName}>Author Unknown</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  newsContainer: {
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
  newsImage: {
    width: 80,
    height: 80,
    borderRadius: 5,
    marginHorizontal: 15,
    margin: 15,
    resizeMode: "cover",
  },
  centerView: {
    flex: 1,
    marginHorizontal: 15,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  dateText: {
    fontSize: 12,
    color: "#666",
  },
  captionText: {
    fontSize: 14,
    color: "#555",
    marginTop: 2,
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
  newsContainerHorizontal: {
    backgroundColor: "#fff",
    borderRadius: 5,
    elevation: 0.5,
    width: 150, // Fixed width for horizontal cards
    marginRight: 10,
    padding: 10,
    alignItems: "center",
  },
  newsImageHorizontal: {
    width: "100%",
    height: 90,
    borderRadius: 5,
    resizeMode: "cover",
    marginBottom: 5,
  },
  centerViewHorizontal: {
    alignItems: "center",
  },
  newsTitleHorizontal: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
});
