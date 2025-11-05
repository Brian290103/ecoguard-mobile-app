import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import React, { useState, useEffect } from "react";
import { dummyOrganizations } from "../data/organizations";
import { supabase } from "../lib/supabase";
import { generateEmbedding, generateEmbeddings } from "../lib/embeddings";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import Styles from "../lib/styles";
import ImageUploader from "./ImageUploader";
import { upsertOrganizationToQdrant } from "@/lib/qdrantActions/organizationQdrantActions";

interface OrganizationFormProps {
  latitude: number;
  longitude: number;
  userId: string;
}

const FormSchema = z.object({
  name: z.string().min(1, { message: "Organization name is required." }),
  about: z.string().min(1, { message: "About section is required." }),
  logo: z.string().min(1, { message: "Organization logo is required." }),
});

type FormData = z.infer<typeof FormSchema>;

const OrganizationForm = ({
  latitude,
  longitude,
  userId,
}: OrganizationFormProps) => {
  const router = useRouter();
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
      logo: "",
    },
  });

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * dummyOrganizations.length);
    const randomOrg = dummyOrganizations[randomIndex];
    setValue("name", randomOrg.name);
    setValue("about", randomOrg.about);
    setValue("logo", randomOrg.logo);
  }, []);

  const onSubmit = async (data: FormData) => {
    setLoading(true);

    const newOrganizationData = {
      name: data.name,
      about: data.about,
      latitude,
      longitude,
      logo: data.logo,
      user_id: userId,
    };

    const { data: organizationData, error } = await supabase
      .from("organizations")
      .insert(newOrganizationData)
      .select(); // Add .select() to get the inserted data, including the ID

    if (error) {
      Toast.show({
        type: "error",
        text1: "Organization Creation Error",
        text2: error.message,
      });
    } else {
      // Assuming organizationData is an array and we need the first element
      const newOrg = organizationData?.[0];
      if (newOrg) {
        await generateEmbeddings(newOrg.about, newOrg.id, "organizations");
        await upsertOrganizationToQdrant({
          about: newOrg.about,
          id: newOrg.id,
          name: newOrg.name,
          userId: newOrg.user_id,
          logo: newOrg.logo,
        });
      }

      Toast.show({
        type: "success",
        text1: "Organization Created",
        text2: "Your organization has been successfully created.",
      });
      reset();
      // Optionally navigate to a different screen after successful creation
      // router.push("/home/officer/(tabs)/organizations");
    }
    setLoading(false);
  };

  return (
    <View style={Styles.container}>
      <Text style={Styles.inputLabel}>Organization Name</Text>
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
            style={Styles.input}
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

      <Text style={Styles.inputLabel}>Organization Logo</Text>
      <ImageUploader onUrlsChange={(urls) => setValue("logo", urls[0])} />
      {errors.logo && (
        <Text style={Styles.inputError}>{errors.logo.message}</Text>
      )}

      <TouchableOpacity
        style={Styles.primaryButton}
        onPress={handleSubmit(onSubmit)}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={"white"} />
        ) : (
          <Text style={Styles.primaryButtonText}>Create Organization</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default OrganizationForm;
