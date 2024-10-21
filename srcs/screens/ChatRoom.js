import React, {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
  useMemo,
  useCallback,
  useContext,
} from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ImageBackground,
  StyleSheet,
  Platform,
  Alert,
  Modal,
} from "react-native";
import { io } from "socket.io-client";
import axios from "axios";
import { auth } from "../../firebaseConfig";
import { format, parseISO, isSameDay } from "date-fns";
import { API_URL, SOCKET_URL } from "../config";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useTheme, themeStyles } from "./ThemeContext";
import { TTSContext, TranslationContext } from "./SettingsScreen";
import * as Speech from "expo-speech";
import { Picker } from "@react-native-picker/picker";
import { translateText } from "./TranslationService";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

const THEMES = {
  default: {
    uri: "https://i.ibb.co/TYBzTCT/BG.png",
  },
  Cup: {
    uri: "https://i.ibb.co/CwzmmG8/cup.jpg",
  },
  Leaf: {
    uri: "https://i.ibb.co/rwfw6GN/leaf.jpg",
  },
  Plane: {
    uri: "https://i.ibb.co/kJBpVn3/plane.jpg",
  },
  Water: {
    uri: "https://i.ibb.co/QCN5BqQ/theme3.jpg",
  },
};

export default function ChatRoom({ route, navigation }) {
  const socket = io(SOCKET_URL);
  const { conversationId, chatName } = route.params;
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const flatListRef = useRef();
  const { theme } = useTheme();
  const [attachment, setAttachment] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentTheme, setCurrentTheme] = useState("default");
  const [showThemeModal, setShowThemeModal] = useState(false);
  const { ttsEnabled } = useContext(TTSContext);
  const [ttsReady, setTtsReady] = useState(false);
  const { targetLanguage } = useContext(TranslationContext);
  const [translatedMessages, setTranslatedMessages] = useState({});

  useEffect(() => {
    fetchTheme();
    // Add a focus listener to refetch the theme when returning to the screen
    const unsubscribe = navigation.addListener("focus", () => {
      fetchTheme();
    });
    return unsubscribe;
  }, [fetchTheme, navigation]);

  const fetchTheme = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_URL}/user/chat-theme/${auth.currentUser.uid}/${route.params.otherUserId}`
      );
      console.log("Fetched theme:", response.data.theme);
      setCurrentTheme(response.data.theme);
    } catch (error) {
      console.error("Error fetching chat theme:", error);
    }
  }, [route.params.otherUserId]);

  const handleThemeChange = async (theme) => {
    try {
      await axios.post(`${API_URL}/user/set-chat-theme`, {
        userId: auth.currentUser.uid,
        otherUserId: route.params.otherUserId,
        theme,
      });
      setCurrentTheme(theme);
      console.log("theme", theme);
      setShowThemeModal(false);
    } catch (error) {
      console.error("Error setting chat theme:", error);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: chatName,
      headerRight: () => (
        <TouchableOpacity onPress={() => setShowThemeModal(true)}>
          <FontAwesome
            name="ellipsis-v"
            size={24}
            color="#000"
            style={{ marginRight: 15 }}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, chatName]);

  useEffect(() => {
    let isMounted = true;

    const initSpeech = async () => {
      try {
        await Speech.getAvailableVoicesAsync();
        if (isMounted) {
          setTtsReady(true);
        }
      } catch (err) {
        console.error("Speech initialization failed:", err);
      }
    };

    initSpeech();

    return () => {
      isMounted = false;
      if (ttsReady) {
        Speech.stop();
      }
    };
  }, []);
  useEffect(() => {
    const translateMessages = async () => {
      const newTranslations = {};
      const translationPromises = messages.map(async (message) => {
        if (
          !translatedMessages[message._id] ||
          translatedMessages[message._id].language !== targetLanguage
        ) {
          const translatedContent = await translateText(
            message.content,
            targetLanguage
          );
          newTranslations[message._id] = {
            content: translatedContent,
            language: targetLanguage,
          };
        } else {
          newTranslations[message._id] = translatedMessages[message._id];
        }
      });

      await Promise.all(translationPromises);
      setTranslatedMessages(newTranslations);
    };

    translateMessages();
  }, [messages, targetLanguage]);

  const speakMessage = (message) => {
    if (ttsEnabled && ttsReady) {
      const textToSpeak =
        translatedMessages[message._id]?.content || message.content;
      Speech.speak(textToSpeak);
    }
  };

  useEffect(() => {
    socket.connect();
    socket.emit("joinRoom", conversationId);
    socket.on("newMessage", handleNewMessage);

    fetchMessages();

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.emit("leaveRoom", conversationId);
      socket.disconnect();
    };
  }, [conversationId]);

  const handleNewMessage = useCallback((message) => {
    setMessages((prevMessages) => {
      const messageExists = prevMessages.some((msg) => msg._id === message._id);
      if (!messageExists) {
        return [...prevMessages, message];
      }
      return prevMessages;
    });

    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API_URL}/messages/${conversationId}`);
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const sendMessage = async (content) => {
    if (!content.trim()) return;

    try {
      const messageData = {
        _id: Date.now().toString(),
        conversationId,
        senderId: auth.currentUser.uid,
        content,
        timestamp: new Date().toISOString(),
      };

      socket.emit("sendMessage", messageData);
      setMessages((prevMessages) => [...prevMessages, messageData]);

      const response = await axios.post(`${API_URL}/messages`, messageData);

      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === messageData._id ? { ...msg, _id: response.data._id } : msg
        )
      );

      setInputMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg._id !== messageData._id)
      );
    }
  };

  const groupMessagesByDate = (messages) => {
    const groups = [];
    let currentGroup = [];
    let currentDate = null;

    messages.forEach((message) => {
      const messageDate = parseISO(message.timestamp || message.createdAt);
      if (!currentDate || !isSameDay(currentDate, messageDate)) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }

    return groups;
  };

  const memoizedMessages = useMemo(
    () => groupMessagesByDate(messages),
    [messages]
  );

  const renderThemeModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showThemeModal}
      onRequestClose={() => setShowThemeModal(false)}
    >
      <View style={styles.modalView}>
        <Text style={styles.modalTitle}>Choose a theme</Text>

        <Picker
          selectedValue={currentTheme}
          onValueChange={(theme) => handleThemeChange(theme)}
          style={{ width: 150, height: 50 }}
        >
          {Object.keys(THEMES).map((theme) => (
            <Picker.Item value={theme} key={theme} label={theme} />
          ))}
        </Picker>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setShowThemeModal(false)}
        >
          <Text>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );

  const renderMessageGroup = ({ item, index }) => (
    <View key={`group-${index}`}>
      <Text style={styles.dateHeader}>
        {format(item.date, "EEEE, MMMM d, yyyy")}
      </Text>
      {item.messages.map((message) =>
        renderMessage({ item: message, key: message._id })
      )}
    </View>
  );

  const pickDocument = async () => {
    try {
      console.log("Starting document picker...");

      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: false,
      });

      console.log("Document picker result:", JSON.stringify(result, null, 2));

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        console.log("File selected successfully:", file.name);
        setAttachment(file);
        Alert.alert(
          "File selected",
          `Name: ${file.name}, Size: ${file.size} bytes`
        );
      } else if (result.canceled) {
        console.log("Document picker was cancelled by the user");
      } else {
        console.log("No file selected");
      }
    } catch (err) {
      console.error("Error in pickDocument:", err);
      if (Platform.OS === "ios") {
        console.log("iOS specific error info:", err.code, err.message);
      }
      Alert.alert("Error", "Failed to pick document. Please try again.");
    }
  };

  // Update the uploadAttachment function to work with the new file structure
  const uploadAttachment = async () => {
    if (!attachment) {
      console.log("No attachment to upload");
      return;
    }

    const formData = new FormData();
    formData.append("file", {
      uri: attachment.uri,
      type: attachment.mimeType,
      name: attachment.name,
    });
    formData.append("conversationId", conversationId);
    formData.append("senderId", auth.currentUser.uid);

    try {
      console.log("Uploading file:", attachment.name);
      console.log("API URL:", `${API_URL}/upload`);

      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log("Upload progress:", percentCompleted);
          setUploadProgress(percentCompleted);
        },
        timeout: 30000, // Set a 30-second timeout
      });

      console.log("Upload response:", response.data);

      const newMessage = response.data;
      socket.emit("sendMessage", newMessage);
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setAttachment(null);
      setUploadProgress(0);
      Alert.alert("Success", "File uploaded successfully");
    } catch (error) {
      console.error("Error uploading attachment:", error);

      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Server responded with error:", error.response.data);
        console.error("Status code:", error.response.status);
        console.error("Headers:", error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error("No response received:", error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error setting up request:", error.message);
      }

      let errorMessage = "Failed to upload attachment. ";
      if (error.message === "Network Error") {
        errorMessage += "Please check your internet connection and try again.";
      } else if (error.code === "ECONNABORTED") {
        errorMessage +=
          "The upload timed out. Please try again with a smaller file or check your connection.";
      } else {
        errorMessage += "Please try again.";
      }

      Alert.alert("Error", errorMessage);
    }
  };

  const downloadAttachment = async (fileUrl, fileName) => {
    const downloadResumable = FileSystem.createDownloadResumable(
      fileUrl,
      FileSystem.documentDirectory + fileName,
      {},
      (downloadProgress) => {
        const progress =
          downloadProgress.totalBytesWritten /
          downloadProgress.totalBytesExpectedToWrite;
        console.log(`Downloaded: ${progress * 100}%`);
      }
    );

    try {
      const { uri } = await downloadResumable.downloadAsync();
      console.log("File downloaded to:", uri);
      Alert.alert("Success", "File downloaded successfully");
    } catch (error) {
      console.error("Error downloading file:", error);
      Alert.alert("Error", "Failed to download file");
    }
  };
  const renderAttachment = (item) => {
    if (item.type === "attachment") {
      return (
        <View style={styles.attachmentContainer}>
          {/* <Text style={styles.attachmentName}>{item.fileName}</Text> */}
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={() => downloadAttachment(item.fileUrl, item.fileName)}
          >
            {/*  */}
            <MaterialCommunityIcons
              name="download-circle-outline"
              size={14}
              color="#4B4F07"
            >
              <Text style={styles.downloadButtonText}>Download</Text>
            </MaterialCommunityIcons>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

  const renderMessage = ({ item }) => {
    const isCurrentUser = item.senderId === auth.currentUser.uid;
    const messageStyle = isCurrentUser
      ? styles.sentMessage
      : styles.receivedMessage;

    let messageContent = translatedMessages[item._id]?.content || item.content;

    return (
      <TouchableOpacity
        style={messageStyle}
        onPress={() => speakMessage(item)}
        selectable
      >
        <Text selectable>{messageContent}</Text>
        {item.content !== messageContent && (
          <Text style={styles.originalText}>Original: {item.content}</Text>
        )}
        {renderAttachment(item)}
        <View style={styles.messageFooter}>
          <Text style={styles.timeText}>
            {format(parseISO(item.timestamp), "h:mm a")}
          </Text>
          {ttsEnabled && ttsReady && (
            <FontAwesome
              name="volume-up"
              size={14}
              color="#888"
              style={styles.speakerIcon}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderInputContainer = () => (
    <View style={[styles.inputContainer, themeStyles[theme]]}>
      <TextInput
        style={[styles.input, themeStyles[theme]]}
        value={inputMessage}
        onChangeText={setInputMessage}
        placeholder="Type a message..."
      />
      <TouchableOpacity style={styles.attachButton} onPress={pickDocument}>
        <FontAwesome name="paperclip" size={24} color="#bac308" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.sendButton}
        onPress={() => {
          if (attachment) {
            uploadAttachment();
          } else {
            sendMessage(inputMessage);
          }
        }}
      >
        {uploadProgress < !100 ? (
          <FontAwesome name="send" size={30} color="#bac308" disabled={true} />
        ) : (
          <FontAwesome name="send" size={30} color="#bac308" disabled={true} />
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <ImageBackground
        source={THEMES[currentTheme] || THEMES.default}
        resizeMode="cover"
        style={styles.image}
      >
        <FlatList
          ref={flatListRef}
          data={memoizedMessages}
          renderItem={renderMessageGroup}
          keyExtractor={(item, index) => `group-${index}`}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          contentContainerStyle={styles.messageList}
          extraData={[messages.length, translatedMessages]}
        />
        {attachment && (
          <View style={styles.attachmentPreview}>
            <Text numberOfLines={1} ellipsizeMode="middle">
              Selected file: {attachment.name}
            </Text>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <Text
                style={{ flex: 1, justifyContent: "center", color: "green" }}
              >{`Uploading: ${uploadProgress}%`}</Text>
            )}
          </View>
        )}
        {renderInputContainer()}
      </ImageBackground>
      {renderThemeModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  image: {
    flex: 1,
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  textStyle: {
    alignSelf: "flex-end",
    margin: 10,
  },
  container: {
    flex: 1,
    // backgroundColor: "#f5f5f5",
  },
  speakerIcon: {
    marginLeft: 5,
  },
  originalText: {
    fontSize: 10,
    color: "#888",
    fontStyle: "italic",
    marginTop: 5,
  },
  messageList: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  dateHeader: {
    textAlign: "center",
    color: "#888",
    marginVertical: 10,
    fontWeight: "bold",
  },
  messageFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  readReceipt: {
    marginLeft: 5,
  },
  sentMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#bac308",
    // backgroundColor: "#DCF8C6",
    padding: 10,
    margin: 5,
    borderRadius: 10,
    maxWidth: "80%",
  },
  receivedMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    padding: 10,
    margin: 5,
    borderRadius: 10,
    maxWidth: "80%",
  },
  sendButton: {
    padding: 5,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonText: {
    color: "#007AFF",
    fontWeight: "bold",
  },
  dateText: {
    textAlign: "center",
    color: "#888",
    marginVertical: 10,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 2,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 10,
  },
  timeText: {
    fontSize: 10,
    color: "#888",
    alignSelf: "flex-end",
    marginTop: 5,
  },

  attachmentContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  attachmentName: {
    flex: 1,
    fontSize: 12,
    color: "#555",
  },
  downloadButton: {
    backgroundColor: "#E4E986",
    borderRadius: 5,
    margin: 2,
    padding: 4,
  },
  downloadButtonText: {
    color: "#4B4F07", // alignSelf: "flex-end",
    fontSize: 14,
    marginBottom: 15,
  },
  attachButton: {
    padding: 5,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  attachmentPreview: {
    backgroundColor: "rgba(240, 240, 240, 0.9)",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 18,
  },
  themeOption: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#2196F3",
    borderRadius: 5,
  },
});
