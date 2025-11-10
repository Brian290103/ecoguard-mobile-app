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
import FileUploader from "./FileUploader";
import { sendResourceNotificationToUsers } from "@/utils/resourceNotifications";
import { Dropdown } from "react-native-element-dropdown";
import { dummyResources } from "../data/dummyResources";

interface ResourceFormProps {
  userId: string;
  onResourceCreated: () => void;
}

const FormSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }),
  caption: z.string().min(1, { message: "Caption is required." }),
  poster_url: z.string().url({ message: "A valid poster URL is required." }),
  resource_url: z
    .string()
    .url({ message: "A valid resource URL is required." }),
  type: z.enum(["youtube", "website", "file"], {
    required_error: "Type is required.",
  }),
});

type FormData = z.infer<typeof FormSchema>;

const resourceTypeData = [
  { label: "YouTube", value: "youtube" },
  { label: "Website", value: "website" },
  { label: "File", value: "file" },
];

const ResourceForm = ({ userId, onResourceCreated }: ResourceFormProps) => {
  const [loading, setLoading] = useState(false);
  const [resourceType, setResourceType] = useState<
    "youtube" | "website" | "file"
  >("website");

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: "",
      caption: "",
      poster_url: "",
      resource_url: "",
      type: "website",
    },
  });

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * dummyResources.length);
    const randomResource = dummyResources[randomIndex];
    setValue("title", randomResource.title);
    setValue("caption", randomResource.caption);
    setValue("poster_url", randomResource.poster_url);
    setValue("resource_url", randomResource.resource_url);
    setValue("type", randomResource.type as "youtube" | "website" | "file");
    setResourceType(randomResource.type as "youtube" | "website" | "file");
  }, []);

  const onSubmit = async (data: FormData) => {
    setLoading(true);

    const newResourceData = {
      title: data.title,
      caption: data.caption,
      poster_url: data.poster_url,
      resource_url: data.resource_url,
      type: data.type,
      user_id: userId,
    };

    const { data: insertedResource, error } = await supabase
      .from("resources")
      .insert(newResourceData)
      .select("id")
      .single();

    if (error) {
      Toast.show({
        type: "error",
        text1: "Resource Submission Error",
        text2: error.message,
      });
      setLoading(false);
      return;
    }

    Toast.show({
      type: "success",
      text1: "Resource Submitted",
      text2: "Your resource has been successfully submitted.",
    });

    if (insertedResource) {
      sendResourceNotificationToUsers(
        newResourceData.title,
        newResourceData.type,
        insertedResource.id,
      );
    }

    reset();
    onResourceCreated();

    setLoading(false);
  };

  return (
    <View style={Styles.container}>
      <Text style={Styles.inputLabel}>Title</Text>
      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={Styles.input}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {errors.title && (
        <Text style={Styles.inputError}>{errors.title.message}</Text>
      )}

      <Text style={Styles.inputLabel}>Caption</Text>
      <Controller
        control={control}
        name="caption"
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
      {errors.caption && (
        <Text style={Styles.inputError}>{errors.caption.message}</Text>
      )}

      <Text style={Styles.inputLabel}>Type</Text>
      <Controller
        control={control}
        name="type"
        render={({ field: { onChange, onBlur, value } }) => (
          <Dropdown
            style={Styles.input}
            data={resourceTypeData}
            labelField="label"
            valueField="value"
            placeholder="Select Resource Type"
            value={value}
            onBlur={onBlur}
            onChange={(item) => {
              onChange(item.value);
              setValue("resource_url", "");
              setResourceType(item.value);
            }}
          />
        )}
      />
      {errors.type && (
        <Text style={Styles.inputError}>{errors.type.message}</Text>
      )}

      {resourceType === "file" ? (
        <>
          <Text style={Styles.inputLabel}>Resource File</Text>
          <FileUploader
            onUrlChange={(url) => setValue("resource_url", url || "")}
          />
          {errors.resource_url && (
            <Text style={Styles.inputError}>{errors.resource_url.message}</Text>
          )}
        </>
      ) : (
        <>
          <Text style={Styles.inputLabel}>Resource URL</Text>
          <Controller
            control={control}
            name="resource_url"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={Styles.input}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="url"
                placeholder={
                  resourceType === "youtube"
                    ? "https://www.youtube.com/watch?v=..."
                    : "https://example.com"
                }
              />
            )}
          />
          {errors.resource_url && (
            <Text style={Styles.inputError}>{errors.resource_url.message}</Text>
          )}
        </>
      )}

      <Text style={Styles.inputLabel}>Poster Image</Text>
      <ImageUploader
        type="single"
        onUrlsChange={(urls) => setValue("poster_url", urls[0] || "")}
      />
      {errors.poster_url && (
        <Text style={Styles.inputError}>{errors.poster_url.message}</Text>
      )}

      <TouchableOpacity
        style={Styles.primaryButton}
        onPress={handleSubmit(onSubmit)}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={"white"} />
        ) : (
          <Text style={Styles.primaryButtonText}>Submit Resource</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default ResourceForm;
