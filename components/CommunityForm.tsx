import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Toast from "react-native-toast-message";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import Styles from "../lib/styles";
import ImageUploader from "./ImageUploader";
import { sendCommunityNotificationToUsers } from "@/utils/communityNotifications";
import { dummyCommunities } from "../data/dummyCommunities";

interface CommunityFormProps {
  userId: string;
  onCommunityCreated: () => void;
}

const FormSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  about: z.string().min(1, { message: "About is required." }),
  icon: z.string().url({ message: "A valid icon URL is required." }),
});

type FormData = z.infer<typeof FormSchema>;

const CommunityForm = ({ userId, onCommunityCreated }: CommunityFormProps) => {
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      about: "",
      icon: "",
    },
  });

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * dummyCommunities.length);
    const randomCommunity = dummyCommunities[randomIndex];
    setValue("name", randomCommunity.name);
    setValue("about", randomCommunity.about);
    setValue("icon", randomCommunity.icon);
  }, []);

  const onSubmit = async (data: FormData) => {
    setLoading(true);

    const newCommunityData = {
      name: data.name,
      about: data.about,
      icon: data.icon,
      user_id: userId,
    };

    const { data: insertedCommunity, error } = await supabase
      .from("community")
      .insert(newCommunityData)
      .select("id")
      .single();

    if (error) {
      Toast.show({
        type: "error",
        text1: "Community Creation Error",
        text2: error.message,
      });
      setLoading(false);
      return;
    }

    Toast.show({
      type: "success",
      text1: "Community Created",
      text2: "Your community has been successfully created.",
    });

    if (insertedCommunity) {
      sendCommunityNotificationToUsers(
        newCommunityData.name,
        insertedCommunity.id,
      );
    }

    reset();
    onCommunityCreated();

    setLoading(false);
  };

  return (
    <View style={Styles.container}>
      <Text style={Styles.inputLabel}>Name</Text>
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={Styles.input}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {errors.name && (
        <Text style={Styles.inputError}>{errors.name.message}</Text>
      )}

      <Text style={Styles.inputLabel}>About</Text>
      <Controller
        control={control}
        name="about"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={Styles.descriptionInput}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            multiline
          />
        )}
      />
      {errors.about && (
        <Text style={Styles.inputError}>{errors.about.message}</Text>
      )}

      <Text style={Styles.inputLabel}>Icon</Text>
      <ImageUploader
        type="single"
        onUrlsChange={(urls) => setValue("icon", urls[0] || "")}
      />
      {errors.icon && (
        <Text style={Styles.inputError}>{errors.icon.message}</Text>
      )}

      <TouchableOpacity
        style={Styles.primaryButton}
        onPress={handleSubmit(onSubmit)}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={"white"} />
        ) : (
          <Text style={Styles.primaryButtonText}>Create Community</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default CommunityForm;
