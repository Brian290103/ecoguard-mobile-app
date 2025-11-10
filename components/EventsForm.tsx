import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
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
import DateTimePicker from "@react-native-community/datetimepicker";
import { dummyEvents } from "../data/events";
import { sendEventNotificationToUsers } from "@/utils/eventNotifications";

interface EventsFormProps {
  userId: string;
  onEventCreated: () => void;
}

const FormSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }),
  description: z.string().min(1, { message: "Description is required." }),
  poster_url: z.string().url({ message: "A valid poster URL is required." }),
  start_date: z.date({ required_error: "Start date is required." }),
  start_time: z.date({ required_error: "Start time is required." }),
  event_fees: z.coerce.number({
    invalid_type_error: "Event fees must be a number.",
  }),
  location: z.string().min(1, { message: "Location is required." }),
});

type FormData = z.infer<typeof FormSchema>;

const EventsForm = ({ userId, onEventCreated }: EventsFormProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

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
      poster_url: "",
      start_date: new Date(),
      start_time: new Date(),
      event_fees: 0,
      location: "",
    },
  });

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * dummyEvents.length);
    const randomEvent = dummyEvents[randomIndex];
    setValue("title", randomEvent.title);
    setValue("description", randomEvent.description);
    setValue("poster_url", randomEvent.poster_url);
    setValue("start_date", randomEvent.start_date);
    setValue("start_time", randomEvent.start_time);
    setValue("event_fees", randomEvent.event_fees);
    setValue("location", randomEvent.location);
  }, []);

  const onSubmit = async (data: FormData) => {
    setLoading(true);

    const combinedDateTime = new Date(data.start_date);
    combinedDateTime.setHours(data.start_time.getHours());
    combinedDateTime.setMinutes(data.start_time.getMinutes());
    combinedDateTime.setSeconds(data.start_time.getSeconds());

    const newEventData = {
      title: data.title,
      description: data.description,
      poster_url: data.poster_url,
      start_date: combinedDateTime.toISOString().split("T")[0], // Store only date part
      start_time: combinedDateTime.toTimeString().split(" ")[0], // Store only time part
      event_fees: data.event_fees,
      location: data.location,
      user_id: userId,
    };

    const { data: insertedEvent, error } = await supabase
      .from("events")
      .insert(newEventData)
      .select("id")
      .single();

    if (error) {
      Toast.show({
        type: "error",
        text1: "Event Submission Error",
        text2: error.message,
      });
      setLoading(false);
      return;
    }

    Toast.show({
      type: "success",
      text1: "Event Submitted",
      text2: "Your event has been successfully submitted.",
    });

    if (insertedEvent) {
      sendEventNotificationToUsers(
        newEventData.title,
        newEventData.location,
        insertedEvent.id,
      );
    }

    reset(); // Clear form fields
    onEventCreated(); // Close the modal

    setLoading(false);
  };

  const onChangeDate = (event: any, selectedDate: Date | undefined) => {
    const currentDate = selectedDate || new Date();
    setShowDatePicker(Platform.OS === "ios");
    setValue("start_date", currentDate);
  };

  const onChangeTime = (event: any, selectedTime: Date | undefined) => {
    const currentTime = selectedTime || new Date();
    setShowTimePicker(Platform.OS === "ios");
    setValue("start_time", currentTime);
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
            style={Styles.descriptionInput}
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

      <Text style={Styles.inputLabel}>Location</Text>
      <Controller
        control={control}
        name="location"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={Styles.input}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {errors.location && (
        <Text style={Styles.inputError}>{errors.location.message}</Text>
      )}

      <Text style={Styles.inputLabel}>Event Fees</Text>
      <Controller
        control={control}
        name="event_fees"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={Styles.input}
            onBlur={onBlur}
            onChangeText={(text) => onChange(text)}
            value={value.toString()}
            keyboardType="numeric"
          />
        )}
      />
      {errors.event_fees && (
        <Text style={Styles.inputError}>{errors.event_fees.message}</Text>
      )}

      <Text style={Styles.inputLabel}>Start Date</Text>
      <TouchableOpacity
        onPress={() => setShowDatePicker(true)}
        style={Styles.input}
      >
        <Text>{control._formValues.start_date.toLocaleDateString()}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={control._formValues.start_date}
          mode="date"
          display="default"
          onChange={onChangeDate}
        />
      )}
      {errors.start_date && (
        <Text style={Styles.inputError}>{errors.start_date.message}</Text>
      )}

      <Text style={Styles.inputLabel}>Start Time</Text>
      <TouchableOpacity
        onPress={() => setShowTimePicker(true)}
        style={Styles.input}
      >
        <Text>
          {control._formValues.start_time.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </TouchableOpacity>
      {showTimePicker && (
        <DateTimePicker
          value={control._formValues.start_time}
          mode="time"
          display="default"
          onChange={onChangeTime}
        />
      )}
      {errors.start_time && (
        <Text style={Styles.inputError}>{errors.start_time.message}</Text>
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
          <Text style={Styles.primaryButtonText}>Submit Event</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default EventsForm;
