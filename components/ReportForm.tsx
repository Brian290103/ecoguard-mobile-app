import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Report } from "../lib/types";
import { dummyReports } from "../data/reports";
import { supabase } from "../lib/supabase";
import {
  generateEmbeddings,
  generateQdrantEmbeddings,
} from "../lib/embeddings";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import Styles from "../lib/styles";
import ImageUploader from "./ImageUploader";
import VideoUploader from "./VideoUploader";
import { sendReportNotificationToOfficers } from "../utils/reportNotifications";
import { upsertReportToQdrant } from "@/lib/qdrantActions/reportQdrantActions";

interface ReportFormProps {
  userId: string;
  latitude: number;
  longitude: number;
}

const FormSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }),
  description: z.string().min(1, { message: "Description is required." }),
  imageUrls: z
    .array(z.string())
    .min(1, { message: "At least one image is required." }),
  videoUrls: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof FormSchema>;

const ReportForm = ({ userId, latitude, longitude }: ReportFormProps) => {
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
      imageUrls: [],
      videoUrls: [],
    },
  });

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * dummyReports.length);
    const randomReport = dummyReports[randomIndex];
    setValue("title", randomReport.title);
    setValue("description", randomReport.description);
    setValue("imageUrls", randomReport.imageUrls);
    setValue("videoUrls", randomReport.videoUrls);
  }, []);

  const generateReportNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const date = now.getDate().toString().padStart(2, "0");
    const seconds = now.getSeconds().toString().padStart(2, "0");
    return `RP${year}${month}${date}${seconds}`;
  };
  const onSubmit = async (data: FormData) => {
    setLoading(true);

    const newReportData: Omit<Report, "id" | "created_at" | "updated_at"> = {
      title: data.title,
      description: data.description,
      latitude,
      longitude,
      report_number: generateReportNumber(),
      user_id: userId,
      image_urls: data.imageUrls,
      video_urls: data.videoUrls || null,
      status: "pending",
    };

    const { data: insertedReport, error: reportError } = await supabase
      .from("reports")
      .insert(newReportData)
      .select("id") // Select the ID of the newly inserted report
      .single(); // Expect a single row back

    console.log({ insertedReport });

    if (reportError) {
      Toast.show({
        type: "error",
        text1: "Report Submission Error",
        text2: reportError.message,
      });
      setLoading(false);
      return; // Stop further execution if report insertion fails
    }

    if (insertedReport) {
      await generateEmbeddings(
        newReportData.description,
        insertedReport.id,
        "reports",
      );
      await upsertReportToQdrant({
        description: newReportData.description,
        id: insertedReport.id,
        title: newReportData.title,
        userId: userId,
      });
      sendReportNotificationToOfficers(newReportData.title, insertedReport.id);
      const newReportHistory = {
        report_id: insertedReport.id,
        user_id: userId,
        notes: "Report submitted.", // Initial note for the history timeline
        status: "pending", // Initial status for the report
      };

      const { error: historyError } = await supabase
        .from("report_history")
        .insert(newReportHistory);

      if (historyError) {
        Toast.show({
          type: "error",
          text1: "Report History Error",
          text2: historyError.message,
        });
        // Log history error but still proceed with report submission success if main report was inserted
      } else {
        Toast.show({
          type: "success",
          text1: "Report Submitted",
          text2: "Your report has been successfully submitted.",
        });
        router.push("/home/user/(tabs)/reports");
      }
    }
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

      <ImageUploader onUrlsChange={(urls) => setValue("imageUrls", urls)} />
      {errors.imageUrls && (
        <Text style={Styles.inputError}>{errors.imageUrls.message}</Text>
      )}

      <VideoUploader onUrlsChange={(urls) => setValue("videoUrls", urls)} />
      {errors.videoUrls && (
        <Text style={Styles.inputError}>{errors.videoUrls.message}</Text>
      )}

      <TouchableOpacity
        style={Styles.primaryButton}
        onPress={handleSubmit(onSubmit)}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={"white"} />
        ) : (
          <Text style={Styles.primaryButtonText}>Submit Report</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default ReportForm;
