import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Toast from "react-native-toast-message";
import { supabase } from "@/lib/supabase";
import Styles from "@/lib/styles";
import { router } from "expo-router";
import Colors from "@/lib/colors";
import { getAbbreviation } from "@/lib/utils";
import type { UserProfile } from "@/lib/types";

interface UserProfileFormProps {
  userProfile: UserProfile;
  onProfileUpdated: (updatedProfile: UserProfile) => void;
}

const FormSchema = z.object({
  first_name: z.string().min(1, { message: "First name is required." }),
  last_name: z.string().min(1, { message: "Last name is required." }),
  phone: z
    .string()
    .nullable()
    .optional()
    .transform((e) => (e === "" ? null : e)) // Transform empty string to null for storage
    .refine(
      (val) =>
        val === null ||
        (val.startsWith("2547") && val.length === 12) ||
        (val.startsWith("2541") && val.length === 12),
      {
        message:
          "Phone number must start with 2547 or 2541 and be 12 digits long.",
      },
    ),
});

type FormData = z.infer<typeof FormSchema>;

export default function UserProfileForm({
  userProfile,
  onProfileUpdated,
}: UserProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(userProfile.avatar);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      first_name: userProfile.first_name,
      last_name: userProfile.last_name,
      phone: userProfile.phone?.toString() || "", // Convert number to string for TextInput
    },
  });

  useEffect(() => {
    setValue("first_name", userProfile.first_name);
    setValue("last_name", userProfile.last_name);
    setValue("phone", userProfile.phone?.toString() || "");
    setAvatarUrl(userProfile.avatar);
  }, [userProfile, setValue]);

  const showImagePickerOptions = () => {
    Alert.alert(
      "Select Avatar",
      "Choose an option",
      [
        { text: "Take Photo", onPress: takePhoto },
        { text: "Choose from Gallery", onPress: pickImage },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true },
    );
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      uploadAvatar(result.assets[0]);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      uploadAvatar(result.assets[0]);
    }
  };

  const uploadAvatar = async (asset: ImagePicker.ImagePickerAsset) => {
    setUploadingAvatar(true);
    try {
      const arraybuffer = await fetch(asset.uri).then((res) =>
        res.arrayBuffer(),
      );
      const fileExt = asset.uri?.split(".").pop()?.toLowerCase() ?? "jpeg";
      const path = `${userProfile.id}/${Date.now()}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from("profiles")
        .upload(path, arraybuffer, {
          contentType: asset.mimeType ?? "image/jpeg",
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const newAvatarUrl = supabase.storage
        .from("profiles")
        .getPublicUrl(data.path).data.publicUrl;

      const { error: updateError } = await supabase
        .from("profile")
        .update({ avatar: newAvatarUrl, updated_at: new Date().toISOString() })
        .eq("id", userProfile.id);

      if (updateError) {
        throw updateError;
      }

      setAvatarUrl(newAvatarUrl);
      onProfileUpdated({ ...userProfile, avatar: newAvatarUrl });
      Toast.show({
        type: "success",
        text1: "Avatar Updated",
        text2: "Your profile picture has been successfully updated.",
      });
    } catch (error) {
      if (error instanceof Error) {
        Toast.show({
          type: "error",
          text1: "Avatar Update Error",
          text2: error.message,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Avatar Update Error",
          text2: "An unknown error occurred.",
        });
      }
    } finally {
      setUploadingAvatar(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const updates = {
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone ? parseInt(data.phone, 10) : null, // data.phone is string or null, convert to int for DB
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("profile")
        .update(updates)
        .eq("id", userProfile.id);

      console.log({ error });
      if (error) {
        throw error;
      }

      Toast.show({
        type: "success",
        text1: "Profile Updated",
        text2: "Your profile has been successfully updated.",
      });
      onProfileUpdated({ ...userProfile, ...updates });
    } catch (error) {
      if (error instanceof Error) {
        Toast.show({
          type: "error",
          text1: "Update Error",
          text2: error.message,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Update Error",
          text2: "An unknown error occurred.",
        });
      }
    } finally {
      setLoading(false);
    }
  };



  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <TouchableOpacity
          onPress={showImagePickerOptions}
          disabled={uploadingAvatar}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {getAbbreviation(userProfile.first_name, userProfile.last_name)}
              </Text>
            </View>
          )}
          {uploadingAvatar && (
            <ActivityIndicator
              size="small"
              color="#fff"
              style={styles.avatarLoader}
            />
          )}
        </TouchableOpacity>
        <Text style={styles.name}>
          {userProfile.first_name} {userProfile.last_name}
        </Text>
        <Text style={styles.email}>{userProfile.email}</Text>
        {userProfile.phone && (
          <Text style={styles.detail}>Phone: {userProfile.phone}</Text>
        )}
        <View style={styles.roleContainer}>
          <Text style={styles.role}>{userProfile.role}</Text>
        </View>
      </View>
      <View style={styles.formContainer}>
        <Text style={Styles.inputLabel}>First Name</Text>
        <Controller
          control={control}
          name="first_name"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={Styles.input}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              autoCapitalize="words"
            />
          )}
        />
        {errors.first_name && (
          <Text style={Styles.inputError}>{errors.first_name.message}</Text>
        )}

        <Text style={Styles.inputLabel}>Last Name</Text>
        <Controller
          control={control}
          name="last_name"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={Styles.input}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              autoCapitalize="words"
            />
          )}
        />
        {errors.last_name && (
          <Text style={Styles.inputError}>{errors.last_name.message}</Text>
        )}

        <Text style={Styles.inputLabel}>Email</Text>
        <TextInput
          style={[Styles.input, styles.disabledInput]}
          value={userProfile.email}
          editable={false}
        />

        <Text style={Styles.inputLabel}>Phone</Text>
        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={Styles.input}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value ?? ""} // Ensure value is a string for TextInput
              keyboardType="phone-pad"
            />
          )}
        />
        {errors.phone && (
          <Text style={Styles.inputError}>{errors.phone.message}</Text>
        )}

        <TouchableOpacity
          style={Styles.primaryButton}
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={Styles.primaryButtonText}>Update Profile</Text>
          )}
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    marginBottom: 10,
    borderRadius: 5,
    marginHorizontal: 10,
    elevation: 0.5,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 50,
    marginBottom: 10,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 50,
    backgroundColor: Colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  avatarText: {
    color: Colors.primary,
    fontSize: 22,
    fontStyle: "italic",
  },

  name: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: Colors.gray,
    marginBottom: 5,
  },
  detail: {
    fontSize: 16,
    color: Colors.gray,
    marginBottom: 5,
  },
  roleContainer: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 5,
    marginTop: 5,
  },
  role: {
    color: Colors.white,
    textTransform: "uppercase",
  },
  formContainer: {
    padding: 20,
    marginHorizontal: 10,
    backgroundColor: "white",
    borderRadius: 5,
    elevation: 0.5,
  },
  disabledInput: {
    backgroundColor: Colors.lightGray,
    color: Colors.gray,
  },

});
