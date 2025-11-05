import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";
import Colors from "@/lib/colors";
import { supabase } from "@/lib/supabase";
import { getAbbreviation } from "@/lib/utils";

interface OrganizationProfile {
  id: string;
  name: string;
  created_at: string;
  logo: string | null;
}

export default function WelcomeOrgRep() {
  const [organizationProfile, setOrganizationProfile] = useState<OrganizationProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const setupOrganizationProfile = async () => {
      setLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        setIsAuthenticated(false);
        setOrganizationProfile(null);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);

      // Fetch organization_id from org_reps table
      const { data: orgRep, error: orgRepError } = await supabase
        .from("org_reps")
        .select("org_id")
        .eq("user_id", session.user.id)
        .eq("is_approved", true)
        .single();

      if (orgRepError || !orgRep?.org_id) {
        console.error("Error fetching approved organization ID for user:", orgRepError);
        setOrganizationProfile(null);
        setLoading(false);
        return;
      }

      // Fetch organization details using org_id from org_reps
      const { data: organization, error: organizationError } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", orgRep.org_id)
        .single();

      if (organizationError || !organization) {
        console.error("Error fetching organization profile:", organizationError);
        setOrganizationProfile(null);
      } else {
        setOrganizationProfile(organization as OrganizationProfile);
      }
      setLoading(false);

      const organizationSubscription = supabase
        .channel("organization_changes")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "organizations",
            filter: `id=eq.${orgRep.org_id}`,
          },
          (payload) => {
            setOrganizationProfile(payload.new as OrganizationProfile);
          }
        )
        .subscribe();

      return () => {
        organizationSubscription.unsubscribe();
      };
    };

    setupOrganizationProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated || !organizationProfile) {
    return null;
  }

  const { name, created_at, logo } = organizationProfile;
  const createdAtDate = new Date(created_at).toLocaleDateString();

  return (
    <View style={styles.container}>
      <View style={styles.orgInfoContainer}>
        <Text style={styles.name}>
          Representing {name}
        </Text>
        <Text style={styles.createdAt}>
          Since {createdAtDate}
        </Text>
      </View>
      {logo ? (
        <Image source={{ uri: logo }} style={styles.logo} />
      ) : (
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>
            {getAbbreviation(name)}
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
    marginTop: 10, // Added margin to separate from WelcomeUser
  },
  orgInfoContainer: {
    flex: 1,
    alignItems: "flex-start",
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 50,
  },
  logoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 50,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  logoText: {
    color: Colors.primary,
    fontSize: 24,
    fontWeight: "bold",
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "left",
  },
  createdAt: {
    fontSize: 16,
    color: "#666",
    textAlign: "left",
  },
});
