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
import { useRouter } from "expo-router";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import Styles from "../lib/styles";
import ImageUploader from "./ImageUploader";
import { dummyNews } from "../data/news";
import { sendNewsNotificationToUsers } from "@/utils/newsNotifications";

interface NewsFormProps {
  userId: string;
  onNewsCreated: () => void;
}

const FormSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }),
  description: z.string().min(1, { message: "Description is required." }),
  caption: z.string().min(1, { message: "Caption is required." }).max(250, { message: "Caption must be 250 characters or less." }),
  poster_url: z.string().url({ message: "A valid poster URL is required." }),
});

type FormData = z.infer<typeof FormSchema>;

const NewsForm = ({ userId, onNewsCreated }: NewsFormProps) => {
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
      title: "",
      description: "",
      caption: "",
      poster_url: "",
    },
  });

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * dummyNews.length);
    const randomNews = dummyNews[randomIndex];
    setValue("title", randomNews.title);
    setValue("description", randomNews.description);
    setValue("caption", randomNews.caption);
    setValue("poster_url", randomNews.poster_url);
  }, []);

  const onSubmit = async (data: FormData) => {
    setLoading(true);

    const newNewsData = {
      title: data.title,
      description: data.description,
      caption: data.caption,
      poster_url: data.poster_url,
      user_id: userId,
    };

    const { data: insertedNews, error } = await supabase.from("news").insert(newNewsData).select('id').single();

    if (error) {
      Toast.show({
        type: "error",
        text1: "News Submission Error",
        text2: error.message,
      });
      setLoading(false);
      return;
    }

    Toast.show({
      type: "success",
      text1: "News Submitted",
      text2: "Your news has been successfully submitted.",
    });
    if (insertedNews) {
      sendNewsNotificationToUsers(newNewsData.title, newNewsData.caption, insertedNews.id);
    }
    reset(); // Clear form fields
    onNewsCreated(); // Close the modal

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
            style={Styles.input}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            maxLength={250}
          />
        )}
      />
      {errors.caption && (
        <Text style={Styles.inputError}>{errors.caption.message}</Text>
      )}

      <Text style={Styles.inputLabel}>Description</Text>
      <Controller
        control={control}
        name="description"
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
      {errors.description && (
        <Text style={Styles.inputError}>{errors.description.message}</Text>
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
          <Text style={Styles.primaryButtonText}>Submit News</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default NewsForm;
