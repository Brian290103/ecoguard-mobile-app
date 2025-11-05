import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  Modal,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Message } from "@/lib/types";
import Colors from "@/lib/colors";
import { getAbbreviation } from "@/lib/utils";
import * as Linking from "expo-linking";
import { useState } from "react";

interface ChatListProps {
  messages: Message[];
  user: any;
  flatListRef: React.RefObject<FlatList<any>>;
  type: "community" | "single";
}

const ChatList = ({ messages, user, flatListRef, type }: ChatListProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setModalVisible(true);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
    setModalVisible(false);
  };
  return (
    <>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isMyMessage = item.sender_id === user.id;

          return (
            <View
              style={[
                styles.messageRow,
                isMyMessage ? styles.myMessageRow : styles.theirMessageRow,
              ]}
            >
              {item.is_action ? (
                <View style={styles.actionMessageContainer}>
                  <Text style={styles.actionMessageText}>
                    {item.message || "An Action was triggered"}
                  </Text>
                </View>
              ) : (
                <>
                  {type === "community" &&
                    !isMyMessage &&
                    (item.sender.avatar ? (
                      <Image
                        source={{ uri: item.sender.avatar }}
                        style={styles.avatar}
                      />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>
                          {getAbbreviation(
                            item.sender.first_name,
                            item.sender.last_name,
                          )}
                        </Text>
                      </View>
                    ))}
                  <View
                    style={[
                      styles.messageContainer,
                      isMyMessage ? styles.myMessage : styles.theirMessage,
                    ]}
                  >
                    {type === "community" && !isMyMessage && (
                      <Text style={styles.senderName}>
                        {item.sender.first_name} {item.sender.last_name}
                      </Text>
                    )}
                    {item.attachments &&
                      item.attachments.length > 0 &&
                      (item.attachments[0].type === "photo" ? (
                        <TouchableOpacity
                          onPress={() =>
                            openImageModal(item.attachments[0].url)
                          }
                        >
                          <Image
                            source={{ uri: item.attachments[0].url }}
                            style={styles.attachmentImage}
                          />
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          onPress={() =>
                            Linking.openURL(item.attachments[0].url)
                          }
                        >
                          <View style={styles.documentAttachment}>
                            <Ionicons
                              name="document-text"
                              size={24}
                              color={Colors.primary}
                            />
                            <Text style={styles.documentName}>
                              {item.attachments[0].url.split("/").pop()}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    <Text style={styles.messageText}>{item.message}</Text>
                    <Text style={styles.timestamp}>
                      {new Date(item.created_at).toLocaleTimeString()}
                    </Text>
                  </View>
                </>
              )}
            </View>
          );
        }}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
      />
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeImageModal}
      >
        {/* Changed from View to TouchableOpacity to allow closing the modal by tapping the background.
            The activeOpacity is set to 1 to prevent visual feedback (like dimming) on background tap. */}
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={closeImageModal}
        >
          {/* The image itself. Tapping on the image will also trigger the parent TouchableOpacity's
              onPress, causing the modal to close. */}
          <Image
            source={{ uri: selectedImage }}
            style={styles.modalImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  messageRow: {
    flexDirection: "row",
    marginVertical: 5,
    marginHorizontal: 10,
    alignItems: "flex-end",
  },
  myMessageRow: {
    justifyContent: "flex-end",
  },
  theirMessageRow: {
    justifyContent: "flex-start",
  },
  messageContainer: {
    padding: 10,
    borderRadius: 10,
    maxWidth: "80%",
  },
  myMessage: {
    backgroundColor: "#DCF8C6",
    alignSelf: "flex-end",
  },
  theirMessage: {
    backgroundColor: "#fff",
    alignSelf: "flex-start",
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
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  avatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  avatarText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "bold",
  },
  attachmentImage: {
    width: 200,
    height: 150,
    borderRadius: 10,
    marginBottom: 5,
  },
  documentAttachment: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.lightGray,
    padding: 10,
    borderRadius: 10,
    marginBottom: 5,
  },
  documentName: {
    marginLeft: 10,
    fontSize: 16,
    color: Colors.primary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: "100%",
    height: "80%",
  },
  actionMessageContainer: {
    width: "100%",
    alignItems: "center",
    marginVertical: 5,
    backgroundColor: Colors.background,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: "dashed",
  },
  actionMessageText: {
    fontSize: 12,
    color: Colors.primary,
    width: "100%",
    textAlign: "center",
  },
});

export default ChatList;
