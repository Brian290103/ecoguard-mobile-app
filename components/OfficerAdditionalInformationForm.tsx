import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";

import { counties } from "@/data/counties";

const countyData = counties.map((county) => ({
  label: county.name,
  value: county.name.toLowerCase().replace(/ /g, "_"),
}));

const subCountyData: { [key: string]: { label: string; value: string }[] } = {};
counties.forEach((county) => {
  subCountyData[county.name.toLowerCase().replace(/ /g, "_")] =
    county.sub_counties.map((subCounty) => ({
      label: subCounty,
      value: subCounty.toLowerCase().replace(/ /g, "_"),
    }));
});
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Toast from "react-native-toast-message";
import { supabase } from "@/lib/supabase";
import Styles from "@/lib/styles";
import type { UserProfile } from "@/lib/types";

interface OfficerAdditionalInformationFormProps {
  userProfile: UserProfile;
  onProfileUpdated: (updatedProfile: UserProfile) => void;
}

const FormSchema = z.object({
  county: z.string().min(1, { message: "County is required." }),
  sub_county: z.string().min(1, { message: "Sub-County is required." }),
  job_title: z.string().min(1, { message: "Job Title is required." }),
});

type FormData = z.infer<typeof FormSchema>;

export default function OfficerAdditionalInformationForm({
  userProfile,
  onProfileUpdated,
}: OfficerAdditionalInformationFormProps) {
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      county: userProfile.county
        ? userProfile.county.toLowerCase().replace(/ /g, "_")
        : undefined,
      sub_county: userProfile.sub_county
        ? userProfile.sub_county.toLowerCase().replace(/ /g, "_")
        : undefined,
      job_title: userProfile.job_title || "",
    },
  });

  const [selectedCounty, setSelectedCounty] = useState<string | undefined>(
    userProfile.county
      ? userProfile.county.toLowerCase().replace(/ /g, "_")
      : undefined,
  );

  useEffect(() => {
    setValue(
      "county",
      userProfile.county
        ? userProfile.county.toLowerCase().replace(/ /g, "_")
        : undefined,
    );
    setValue(
      "sub_county",
      userProfile.sub_county
        ? userProfile.sub_county.toLowerCase().replace(/ /g, "_")
        : undefined,
    );
    setValue("job_title", userProfile.job_title || "");
    setSelectedCounty(
      userProfile.county
        ? userProfile.county.toLowerCase().replace(/ /g, "_")
        : undefined,
    );
  }, [userProfile, setValue]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const getLabelFromValue = (
      value: string | undefined,
      dataArray: { label: string; value: string }[],
    ) => {
      const found = dataArray.find((item) => item.value === value);
      return found ? found.label : value;
    };

    try {
      const updates = {
        county: getLabelFromValue(data.county, countyData),
        sub_county: data.county
          ? getLabelFromValue(data.sub_county, subCountyData[data.county])
          : data.sub_county,
        job_title: data.job_title,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("profile")
        .update(updates)
        .eq("id", userProfile.id);

      if (error) {
        throw error;
      }

      Toast.show({
        type: "success",
        text1: "Profile Updated",
        text2:
          "Your additional profile information has been successfully updated.",
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
    <View style={styles.formContainer}>
      <Text style={Styles.inputLabel}>County</Text>
      <Controller
        control={control}
        name="county"
        render={({ field: { onChange, onBlur, value } }) => (
          <Dropdown
            style={Styles.input}
            data={countyData}
            labelField="label"
            valueField="value"
            placeholder="Select County"
            value={value}
            onBlur={onBlur}
            onChange={(item) => {
              onChange(item.value);
              setSelectedCounty(item.value);
              setValue("sub_county", undefined);
            }}
          />
        )}
      />
      {errors.county && (
        <Text style={Styles.inputError}>{errors.county.message}</Text>
      )}

      <Text style={Styles.inputLabel}>Sub-County</Text>
      <Controller
        control={control}
        name="sub_county"
        render={({ field: { onChange, onBlur, value } }) => (
          <Dropdown
            style={Styles.input}
            data={selectedCounty ? subCountyData[selectedCounty] : []}
            labelField="label"
            valueField="value"
            placeholder="Select Sub-County"
            value={value}
            onBlur={onBlur}
            onChange={(item) => onChange(item.value)}
            disable={!selectedCounty}
          />
        )}
      />
      {errors.sub_county && (
        <Text style={Styles.inputError}>{errors.sub_county.message}</Text>
      )}

      <Text style={Styles.inputLabel}>Job Title</Text>
      <Controller
        control={control}
        name="job_title"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={Styles.input}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value ?? ""}
            autoCapitalize="words"
          />
        )}
      />
      {errors.job_title && (
        <Text style={Styles.inputError}>{errors.job_title.message}</Text>
      )}

      <TouchableOpacity
        style={Styles.primaryButton}
        onPress={handleSubmit(onSubmit)}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={Styles.primaryButtonText}>Update Additional Info</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    padding: 20,
    marginHorizontal: 10,
    backgroundColor: "white",
    width: "100%",
    borderRadius: 5,
    elevation: 0.5,
    marginTop: 10,
  },
});
