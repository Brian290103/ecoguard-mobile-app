import { TouchableOpacity, Text, ActivityIndicator, View, TextInput } from "react-native";
import type { Report } from "@/lib/types";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Toast from "react-native-toast-message";
import { supabase } from "@/lib/supabase";
import Styles from "@/lib/styles";
import Colors from "@/lib/colors";
import Ionicons from "@expo/vector-icons/Ionicons";
import ImageUploader from "./ImageUploader";
import { updateReportStatusAndHistory } from "@/lib/reportActions";

const ResolveFormSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters." }),
  description: z.string().min(20, { message: "Description must be at least 20 characters." }),
  image_urls: z.array(z.string()).optional(),
});

type ResolveFormData = z.infer<typeof ResolveFormSchema>;

interface ResolveReportFormProps {
  report: Report;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ResolveReportForm({ report, onClose, onSuccess }: ResolveReportFormProps) {
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ResolveFormData>({
    resolver: zodResolver(ResolveFormSchema),
    defaultValues: {
      title: "Report Resolution Summary",
      description: "This report has been successfully resolved through the following actions:\n\n- Action 1: ...\n- Action 2: ...\n\nFurther details: ",
      image_urls: [],
    },
  });

  async function handleResolveReport(data: ResolveFormData) {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not authenticated.");
      }

      const imageUrlsArray = data.image_urls || [];

      // Insert into resolved_reports table
      const { error: resolveError } = await supabase.from("resolved_reports").insert({
        report_id: report.id,
        user_id: user.id,
        title: data.title,
        description: data.description,
        images_urls: imageUrlsArray,
      });

      if (resolveError) {
        throw resolveError;
      }

      // Update report status to 'resolved' and add to history
      const resolutionNotes = `Resolved with title: ${data.title}. Description: ${data.description}`;
      const { success: updateSuccess, error: updateStatusError } = await updateReportStatusAndHistory(
        report.id,
        user.id,
        "resolved",
        resolutionNotes,
      );

      if (!updateSuccess) {
        throw updateStatusError;
      }

      Toast.show({
        type: "success",
        text1: "Report Resolved",
        text2: "Report has been successfully resolved with the provided summary.",
      });
      onSuccess();
      reset();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Resolution Error",
        text2: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ width: "100%", marginTop: 20 }}>
      <Text style={Styles.inputLabel}>Resolution Summary Title</Text>
      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={Styles.input}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            placeholder="Enter a title for the resolution summary"
          />
        )}
      />
      {errors.title && (
        <Text style={Styles.inputError}>{errors.title.message}</Text>
      )}

      <Text style={Styles.inputLabel}>Resolution Description</Text>
      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={Styles.input}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            placeholder="Provide a detailed description of the resolution (min 20 characters)"
            multiline
            numberOfLines={4}
          />
        )}
      />
      {errors.description && (
        <Text style={Styles.inputError}>{errors.description.message}</Text>
      )}

      <ImageUploader onUrlsChange={(urls) => setValue("image_urls", urls)} />
      {errors.image_urls && (
        <Text style={Styles.inputError}>{errors.image_urls.message}</Text>
      )}

      <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
        <TouchableOpacity
          style={{
            ...Styles.primaryButton,
            flex: 1,
            backgroundColor: loading ? "gray" : Colors.blue,
          }}
          onPress={handleSubmit(handleResolveReport)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={"white"} />
          ) : (
            <Text style={Styles.primaryButtonText}>Submit Resolution</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            ...Styles.primaryButton,
            width: 50,
            backgroundColor: Colors.gray,
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={onClose}
          disabled={loading}
        >
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}