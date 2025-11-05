import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Image,
  Alert,
  Text,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/lib/colors";
import { Message } from "@/lib/types";
import ChatList from "./ChatList";
import * as ImagePicker from "expo-image-picker";
import ChatAttachments from "./ChatAttachments";

import * as DocumentPicker from "expo-document-picker";

import { sendMobilePushNotification } from "@/utils/sendMobilePushNotification";
import { SafeAreaView } from "react-native-safe-area-context";

interface ChatProps {
  type: "community" | "single";
  user: any;
  communityId?: string;
  receiverId?: string;
  participants?: string[];
}

const Chat = ({
  type,
  user,
  communityId,
  receiverId,
  participants,
}: ChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const [attachment, setAttachment] = useState<string | null>(null);
  const [attachmentType, setAttachmentType] = useState<
    "photo" | "document" | null
  >(null);
  const [uploading, setUploading] = useState(false);

  const getRoomId = () => {
    if (type === "community") {
      return communityId;
    } else {
      const ids = [user.id, receiverId].sort();
      return ids.join("-");
    }
  };

  const roomId = getRoomId();

  useEffect(() => {
    const fetchMessages = async () => {
      if (!roomId) return;
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("*, attachments(*)")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      if (messagesError) {
        console.error("Error fetching messages:", messagesError);
        setLoading(false);
        return;
      }

      const messagesWithSenders = await Promise.all(
        messagesData.map(async (message) => {
          const { data: senderData, error: senderError } = await supabase
            .from("profile")
            .select("first_name, last_name, avatar")
            .eq("id", message.sender_id)
            .single();

          if (senderError) {
            console.error("Error fetching sender:", senderError);
            return {
              ...message,
              sender: { first_name: "Unknown", last_name: "User" },
            };
          }

          return { ...message, sender: senderData };
        }),
      );

      setMessages(messagesWithSenders);
      setLoading(false);
    };

    fetchMessages();

    const subscription = supabase
      .channel(`messages:room_id=eq.${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const newMessage = payload.new;
          const { data: senderData, error: senderError } = await supabase
            .from("profile")
            .select("first_name, last_name, avatar")
            .eq("id", newMessage.sender_id)
            .single();

          if (senderError) {
            console.error(
              "Error fetching sender for new message:",
              senderError,
            );
            newMessage.sender = { first_name: "Unknown", last_name: "User" };
          } else {
            newMessage.sender = senderData;
          }

          const { data: attachmentData, error: attachmentError } =
            await supabase
              .from("attachments")
              .select("*")
              .eq("message_id", newMessage.id);

          if (attachmentError) {
            console.error(
              "Error fetching attachment for new message:",
              attachmentError,
            );
          } else {
            newMessage.attachments = attachmentData;
          }

          setMessages((prevMessages) => [...prevMessages, newMessage]);
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [roomId]);

  const uploadFile = async (uri: string, fileType: "photo" | "document") => {
    setUploading(true);
    const arraybuffer = await fetch(uri).then((res) => res.arrayBuffer());
    const fileExt = uri?.split(".").pop()?.toLowerCase() ?? "jpeg";
    const path = `${Date.now()}.${fileExt}`;
    const { data, error: uploadError } = await supabase.storage
      .from("attachments")
      .upload(path, arraybuffer, {
        contentType:
          fileType === "photo" ? `image/${fileExt}` : `application/${fileExt}`,
      });

    if (uploadError) {
      setUploading(false);
      Alert.alert("Error", "Failed to upload attachment.");
      console.error(uploadError);
      return;
    }
    const url = supabase.storage.from("attachments").getPublicUrl(data.path)
      .data.publicUrl;
    setAttachment(url);
    setAttachmentType(fileType);
    setUploading(false);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      uploadFile(result.assets[0].uri, "photo");
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      uploadFile(result.assets[0].uri, "photo");
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({});
    if (!result.canceled) {
      uploadFile(result.assets[0].uri, "document");
    }
  };

  const handleSendMessage = async () => {
    if ((newMessage.trim() === "" && !attachment) || !roomId) return;

    const { data: messageData, error } = await supabase
      .from("messages")
      .insert([
        {
          room_id: roomId,
          sender_id: user.id,
          message: newMessage.trim(),
          type: type,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error sending message:", error);
      return;
    }

    if (attachment && messageData) {
      const { error: attachmentError } = await supabase
        .from("attachments")
        .insert([
          {
            message_id: messageData.id,
            url: attachment,
            type: attachmentType,
          },
        ]);

      if (attachmentError) {
        console.error("Error saving attachment:", attachmentError);
      }
    }

    setNewMessage("");
    setAttachment(null);
    setAttachmentType(null);

    sendNotification(messageData);
  };

  const sendNotification = async (message: Message) => {
    const { data: senderProfile, error: profileError } = await supabase
      .from("profile")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error(
        "Error fetching sender profile for notification:",
        profileError,
      );
      return;
    }

    const senderName = `${senderProfile.first_name} ${senderProfile.last_name}`;
    let userIds: string[] = [];

    if (type === "community") {
      userIds = participants?.filter((id) => id !== user.id) || [];
    } else if (receiverId) {
      userIds = [receiverId];
    }

    if (userIds.length === 0) return;

    const { data: tokens, error } = await supabase
      .from("expo_push_tokens")
      .select("token, user_id")
      .in("user_id", userIds);

    if (error) {
      console.error("Error fetching push tokens:", error);
      return;
    }

    const notifications = tokens.map((t) => ({
      to: t.token,
      title: `New message from ${senderName}`,
      body: message.message || "New message",
      user_id: t.user_id,
      reference_table: "messages",
      reference_row_id: message.id,
    }));

    console.log({ notifications });

    if (notifications.length > 0) {
      sendMobilePushNotification(notifications);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color={Colors.primary} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ChatList
        messages={messages}
        user={user}
        flatListRef={flatListRef}
        type={type}
      />
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={90}
      >
        {attachment && (
          <View style={styles.attachmentPreviewContainer}>
            <Image
              source={{ uri: attachment }}
              style={styles.attachmentPreview}
            />
            <TouchableOpacity
              onPress={() => setAttachment(null)}
              style={styles.removeAttachmentButton}
            >
              <Ionicons
                name="close-circle"
                size={24}
                color={Colors.gray[500]}
              />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputContainer}>
          <ChatAttachments
            onTakePhoto={takePhoto}
            onPickImage={pickImage}
            onPickDocument={pickDocument}
          />
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor={Colors.gray[500]}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (uploading || (newMessage.trim() === "" && !attachment)) &&
                styles.disabledButton,
            ]}
            onPress={handleSendMessage}
            disabled={uploading || (newMessage.trim() === "" && !attachment)}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ECE5DD",
  },

  senderName: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 5,
    color: Colors.primary,
  },
  messageText: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 10,
    color: Colors.gray[500],
    alignSelf: "flex-end",
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#F0F0F0",
  },

  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    minHeight: 40,
    maxHeight: 100, // Limit height for multiline input
    marginHorizontal: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 5,
  },
  disabledButton: {
    backgroundColor: Colors.gray,
  },
  attachmentPreviewContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
  },
  attachmentPreview: {
    width: 50,
    height: 50,
    borderRadius: 5,
    marginRight: 10,
  },
  removeAttachmentButton: {
    position: "absolute",
    top: 0,
    right: 0,
  },
});

export default Chat;
