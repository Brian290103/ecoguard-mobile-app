import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";
import Colors from "@/lib/colors";
import { supabase } from "@/lib/supabase";
import { getAbbreviation } from "@/lib/utils";

// Define the UserProfile interface to fix 'Cannot find name 'UserProfile'.'
interface UserProfile {
  id: string; // Assuming an ID field exists for the profile table
  first_name: string;
  last_name: string;
  email: string;
  avatar: string | null;
  role: string | null;
}

export default function WelcomeUser() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const setupProfile = async () => {
      setLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        setIsAuthenticated(false);
        setUserProfile(null);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);
      const { data: profile, error: profileError } = await supabase
        .from("profile")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profileError || !profile) {
        console.error("Error fetching user profile:", profileError);
        setUserProfile(null);
      } else {
        setUserProfile(profile as UserProfile);
      }
      setLoading(false);

      const profileSubscription = supabase
        .channel("profile_changes")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profile",
            filter: `id=eq.${session.user.id}`,
          },
          (payload) => {
            setUserProfile(payload.new as UserProfile);
          }
        )
        .subscribe();

      return () => {
        profileSubscription.unsubscribe();
      };
    };

    setupProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Return null if the user is not authenticated or profile data couldn't be fetched
  if (!isAuthenticated || !userProfile) {
    return null;
  }

  // Destructure variables, 'email' and 'role' are now used
  const { first_name, last_name, email, avatar, role } = userProfile;

  console.log({ userProfile });

  // The main JSX structure was missing a wrapping View and return statement.
  // This section now correctly returns a single root element with user details.
  return (
    <View style={styles.container}>
      <View style={styles.userInfoContainer}>
        <Text style={styles.name}>
          Welcome {first_name} {last_name}
        </Text>
        <Text style={styles.email}>{email}</Text>
        {role && ( // Only render role if it exists
          <Text style={styles.role}>{role}</Text>
        )}
      </View>
      {avatar ? (
        <Image source={{ uri: avatar }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {getAbbreviation(first_name, last_name)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    padding: 20,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 5,
    marginHorizontal: 20,
    elevation: 0.5,
  },
  userInfoContainer: {
    // Added to group text information
    flex: 1, // Allows the text container to take available space
    alignItems: "flex-start", // Aligns text elements to the start (left)
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 50,
    // Removed marginBottom as it's in a flex-row layout now
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 50,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.primary,
    // Removed marginBottom as it's in a flex-row layout now
  },
  avatarText: {
    color: Colors.primary,
    fontSize: 24,
    fontWeight: "bold",
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "left", // Adjusted for consistent left alignment within userInfoContainer
  },
  email: {
    fontSize: 16,
    color: "#666",
    textAlign: "left", // Adjusted for consistent left alignment within userInfoContainer
  },
  role: {
    fontSize: 12,
    textTransform: "uppercase",
    fontStyle: "italic",
    color: "white", // Kept original white text color
    textAlign: "left", // Adjusted for consistent left alignment within userInfoContainer
    backgroundColor: Colors.primary, // Added background to make white text visible
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 5,
    marginTop: 4,
    alignSelf: "flex-start", // Ensures the background only wraps the text, not full width
  },
});
