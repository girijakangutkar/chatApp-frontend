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
  ImageBackground,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import { io } from "socket.io-client";
import axios from "axios";
import { auth } from "../../firebaseConfig";
import { format, parseISO, isSameDay } from "date-fns";
import { API_URL } from "../config";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useTheme, themeStyles } from "./ThemeContext";
import { TTSContext, TranslationContext } from "./SettingsScreen";
import * as Speech from "expo-speech";
import { translateText } from "./TranslationService";
import { Picker } from "@react-native-picker/picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as MediaLibrary from "expo-media-library";
import * as IntentLauncher from "expo-intent-launcher";
import Ionicons from "@expo/vector-icons/Ionicons";
import Svg, { Circle } from "react-native-svg";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from "react-native-popup-menu";

const APP_DIRECTORY = FileSystem.documentDirectory + "HowYouDoin/";
const DOWNLOAD_TRACKING_FILE = APP_DIRECTORY + "downloaded_attachments.json";

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
  const socket = io("http://192.168.1.3:3000");
  const { conversationId, chatName } = route.params;
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const flatListRef = useRef();
  const { theme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState("default");
  const { ttsEnabled } = useContext(TTSContext);
  const [ttsReady, setTtsReady] = useState(false);
  const { targetLanguage } = useContext(TranslationContext);
  const [translatedMessages, setTranslatedMessages] = useState({});
  const [attachment, setAttachment] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
  const [downloadProgress, setDownloadProgress] = useState({});
  const [downloadedAttachments, setDownloadedAttachments] = useState([]);
  const [myAttachments, setMyAttachments] = useState([]);

  useEffect(() => {
    fetchTheme();
    // Add a focus list
    const unsubscribe = navigation.addListener("focus", () => {
      fetchTheme();
    });
    return unsubscribe;
  }, [fetchTheme, navigation]);

  const ensureDirectoryExists = async () => {
    try {
      const dirInfo = await FileSystem.getInfoAsync(APP_DIRECTORY);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(APP_DIRECTORY, {
          intermediates: true,
        });
      }

      // Create tracking file if it doesn't exist
      const trackingFileInfo = await FileSystem.getInfoAsync(
        DOWNLOAD_TRACKING_FILE
      );
      if (!trackingFileInfo.exists) {
        await FileSystem.writeAsStringAsync(DOWNLOAD_TRACKING_FILE, "[]");
      }
    } catch (error) {
      console.error("Error ensuring directory exists:", error);
    }
  };

  useEffect(() => {
    ensureDirectoryExists().then(() => {
      loadDownloadedAttachments();
    });
  }, []);

  const fetchTheme = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_URL}/user/chat-theme/${auth.currentUser.uid}/${route.params.otherUserId}`
      );
      // console.log("Fetched theme:", response.data.theme);
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
      // console.log("theme", theme);
    } catch (error) {
      console.error("Error setting chat theme:", error);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: chatName,
      headerRight: () => (
        <Menu style={[styles.menuBox, themeStyles[theme]]}>
          <MenuTrigger
            style={[{ padding: 10, marginRight: 5 }, themeStyles[theme]]}
          >
            <FontAwesome
              name="ellipsis-v"
              size={24}
              color="#000"
              style={[
                {
                  marginRight: 10,
                  alignItems: "center",
                  justifyContent: "center",
                },
                themeStyles[theme],
              ]}
            />
          </MenuTrigger>
          <MenuOptions style={[themeStyles[theme]]}>
            <MenuOption style={[themeStyles[theme]]}>
              <View style={[styles.modalView, themeStyles[theme]]}>
                <Text style={[themeStyles[theme]]}>Choose a theme</Text>
                <Picker
                  selectedValue={currentTheme}
                  onValueChange={(theme) => handleThemeChange(theme)}
                  style={[{ width: 150, height: 50 }, themeStyles[theme]]}
                >
                  {Object.keys(THEMES).map((theme) => (
                    <Picker.Item
                      value={theme}
                      key={theme}
                      label={theme}
                      style={[themeStyles[theme]]}
                    />
                  ))}
                </Picker>
              </View>
            </MenuOption>
          </MenuOptions>
        </Menu>
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
          // console.log("Ready to speak");
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
  }, [conversationId, route.params.otherUserId]);

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
      // console.log(textToSpeak);
      Speech.speak(textToSpeak);
    }
  };

  // useEffect(() => {
  //   if (flatListRef.current) {
  //     flatListRef.current.scrollToEnd({ animated: true });
  //   }
  // }, [messages]);

  useEffect(() => {
    socket.connect();
    socket.emit("joinRoom", conversationId);
    socket.on("newMessage", handleNewMessage);
    socket.on("newAttachment", handleNewAttachment);

    fetchMessages();
    // fetchAttachments();

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("newAttachment", handleNewAttachment);
      socket.emit("leaveRoom", conversationId);
      socket.disconnect();
    };
  }, [conversationId, handleNewMessage, handleNewAttachment]);

  const handleNewAttachment = useCallback((attachment) => {
    setMyAttachments((prevAttachments) => {
      const attachmentExists = prevAttachments.some(
        (att) => att._id === attachment._id
      );
      if (!attachmentExists && attachment.senderId === auth.currentUser.uid) {
        return [...prevAttachments, attachment];
      }
      return prevAttachments;
    });

    if (attachment.senderId !== auth.currentUser.uid) {
      setAttachment(attachment);
    }
  }, []);

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

    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  // const fetchAttachments = async () => {
  //   try {
  //     const response = await axios.get(`${API_URL}/upload/${conversationId}`);
  //     const myAttachments = response.data.filter(
  //       (attachment) => attachment.senderId === auth.currentUser.uid
  //     );
  //     const otherAttachments = response.data.filter(
  //       (attachment) => attachment.senderId !== auth.currentUser.uid
  //     );
  //     setMyAttachments(myAttachments);
  //     setAttachment(otherAttachments.length > 0 ? otherAttachments[0] : null);
  //   } catch (error) {
  //     console.log("Error fetching attachments", error);
  //   }
  // };

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

  const pickDocument = async () => {
    if (permissionResponse.status !== "granted") {
      await requestPermission();
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setAttachment(file);
        Alert.alert(
          "File selected",
          `Name: ${file.name}, Size: ${file.size} bytes`
        );

        // Alert.alert(
        //   "File selected",
        //   `Name: ${file.name}, Size: ${file.size} bytes`,
        //   [
        //     {
        //       text: "Cancel",
        //       onPress: () => {
        //         setAttachment(null);
        //       },
        //     },
        //     {
        //       text: "OK",
        //       onPress: () => {
        //         setAttachment(file);
        //       },
        //     },
        //   ],
        //   { cancelable: false }
        // );
      }
    } catch (err) {
      console.error("Error in pickDocument:", err);
      // Alert.alert("Error", "Failed to pick document. Please try again.");
    }
  };

  const uploadAttachment = async () => {
    if (!attachment) return;

    const formData = new FormData();
    formData.append("file", {
      uri: attachment.uri,
      type: attachment.mimeType,
      name: attachment.name,
    });
    formData.append("conversationId", conversationId);
    formData.append("senderId", auth.currentUser.uid);

    try {
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

      const newAttachment = response.data;

      // Emit socket event for new attachment
      socket.emit("sendAttachment", newAttachment);

      // Update local state
      setMyAttachments((prev) => [...prev, newAttachment]);
      setAttachment(null);
      setUploadProgress(0);

      // Copy the file to app's directory
      const newUri = APP_DIRECTORY + newAttachment.fileName;
      await FileSystem.copyAsync({
        from: attachment.uri,
        to: newUri,
      });

      // Alert.alert("Success", "File uploaded successfully");
    } catch (error) {
      console.error("Error uploading attachment:", error);
      // Alert.alert("Error", "Failed to upload attachment. Please try again.");
    }
  };

  const verifyFileExists = async (fileName) => {
    try {
      const filePath = APP_DIRECTORY + fileName;
      const fileInfo = await FileSystem.getInfoAsync(filePath);

      if (!fileInfo.exists && downloadedAttachments.includes(fileName)) {
        // File was deleted but still marked as downloaded
        const updatedDownloads = downloadedAttachments.filter(
          (name) => name !== fileName
        );
        setDownloadedAttachments(updatedDownloads);
        await saveDownloadedAttachments(updatedDownloads);
        return false;
      }
      return fileInfo.exists;
    } catch (error) {
      console.error("Error verifying file:", error);
      return false;
    }
  };

  const downloadAttachment = async (fileUrl, fileName) => {
    console.log(fileUrl);
    try {
      const downloadResumable = FileSystem.createDownloadResumable(
        fileUrl,
        APP_DIRECTORY + fileName,
        {},
        (downloadProgress) => {
          const progress =
            downloadProgress.totalBytesWritten /
            downloadProgress.totalBytesExpectedToWrite;
          setDownloadProgress((prevProgress) => ({
            ...prevProgress,
            [fileName]: progress,
          }));
        }
      );

      await downloadResumable.downloadAsync();

      // Save the file to device's media library
      if (Platform.OS === "ios") {
        await MediaLibrary.saveToLibraryAsync(APP_DIRECTORY + fileName);
      } else {
        await MediaLibrary.createAssetAsync(APP_DIRECTORY + fileName);
      }

      // Update downloaded attachments list and persist it
      const updatedDownloads = [...downloadedAttachments, fileName];
      setDownloadedAttachments(updatedDownloads);
      await saveDownloadedAttachments(updatedDownloads);

      // Alert.alert(
      //   "Success",
      //   "File downloaded successfully. You can find it in your device storage."
      // );
    } catch (error) {
      console.error("Error downloading file:", error);
      // Alert.alert("Error", "Failed to download file");
    }
  };

  const saveDownloadedAttachments = async (attachments) => {
    try {
      await FileSystem.writeAsStringAsync(
        DOWNLOAD_TRACKING_FILE,
        JSON.stringify(attachments)
      );
    } catch (error) {
      console.error("Error saving downloaded attachments:", error);
    }
  };

  const loadDownloadedAttachments = async () => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(DOWNLOAD_TRACKING_FILE);
      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(
          DOWNLOAD_TRACKING_FILE
        );
        const savedAttachments = JSON.parse(content);
        setDownloadedAttachments(savedAttachments);
      }
    } catch (error) {
      console.error("Error loading downloaded attachments:", error);
    }
  };

  const getMimeType = (extension) => {
    const mimeTypes = {
      txt: "text/plain",
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      jpeg: "image/jpeg",
      jpg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      mp3: "audio/mpeg",
      mp4: "video/mp4",
      avi: "video/x-msvideo",
      zip: "application/zip",
    };

    return mimeTypes[extension.toLowerCase()] || "application/octet-stream";
  };

  const openAttachment = async (fileUri) => {
    try {
      // const fileName = fileUri.split("/").pop();
      // const exists = await verifyFileExists(fileName);

      // if (!exists) {
      //   Alert.alert(
      //     "File Not Found",
      //     "The file has been deleted. Please ask them to send it again.",
      //     [
      //       {
      //         text: "Send it again",
      //         onPress: async () => {
      //           const attachmentInfo =
      //             attachment ||
      //             myAttachments.find((a) => a.fileName === fileName);
      //           if (attachmentInfo) {
      //             await downloadAttachment(attachmentInfo.fileUrl, fileName);
      //           }
      //         },
      //       },
      //       {
      //         text: "Cancel",
      //         style: "cancel",
      //       },
      //     ]
      //   );
      //   return;
      // }

      if (Platform.OS === "ios") {
        await Sharing.shareAsync(fileUri);
      } else {
        const fileExtension = fileUri.split(".").pop().toLowerCase();
        const mimeType = getMimeType(fileExtension);
        const contentUri = await FileSystem.getContentUriAsync(fileUri);
        await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
          data: contentUri,
          type: mimeType,
          flags: 1,
        });
      }
    } catch (error) {
      console.error("Error opening file:", error);
      // Alert.alert("Error", "Failed to open attachment");
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

  const renderMessage = ({ item, key }) => {
    const isCurrentUser = item.senderId === auth.currentUser.uid;
    const messageStyle = isCurrentUser
      ? styles.sentMessage
      : styles.receivedMessage;

    const isAttachment = item.type === "attachment";
    const setNumberOfLinesForFile = isAttachment ? 2 : null;

    // Add useEffect for file verification when rendering attachment messages
    // useEffect(() => {
    //   if (isAttachment && !isCurrentUser) {
    //     verifyFileExists(item.fileName);
    //   }
    // }, [item.fileName, isCurrentUser]);

    let messageContent =
      translatedMessages[item._id]?.content ||
      item.content ||
      item.type === "text";

    return (
      <TouchableOpacity
        style={[
          messageStyle,
          item.type === "attachment" ? styles.attachbox : null,
        ]}
        onPress={() => {
          if (item.type === "attachment") {
            if (
              isCurrentUser ||
              downloadedAttachments.includes(item.fileName)
            ) {
              openAttachment(APP_DIRECTORY + item.fileName);
            } else {
              downloadAttachment(item.fileUrl, item.fileName);
            }
          }
          return null;
        }}
        selectable
      >
        <Text
          selectable
          numberOfLines={setNumberOfLinesForFile}
          ellipsizeMode="middle"
          key={item.id}
        >
          {item.type === "attachment" ? (
            <>
              <Ionicons name="document-attach" size={24} color="#888F05" />
            </>
          ) : null}
          {messageContent}
        </Text>
        {item.content !== messageContent && (
          <Text style={styles.originalText}>Original: {item.content}</Text>
        )}
        <View style={styles.messageFooter}>
          <Text style={styles.timeText}>
            {format(parseISO(item.timestamp), "hh:mm:ss aaaa")}
          </Text>
          {ttsEnabled && ttsReady && item.type === "text" && (
            <TouchableOpacity onPress={() => speakMessage(item)}>
              <FontAwesome
                name="volume-up"
                size={20}
                color="#888"
                style={styles.speakerIcon}
              />
            </TouchableOpacity>
          )}
          {!downloadedAttachments.includes(item.fileName) &&
            !isCurrentUser &&
            item.type === "attachment" && (
              <TouchableOpacity
                onPress={() => downloadAttachment(item.fileUrl, item.fileName)}
              >
                <View style={styles.svgContainer}>
                  <Svg
                    height="30"
                    width="30"
                    viewBox="0 0 100 100"
                    style={styles.progressSvg}
                  >
                    <Circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="#888F05"
                      strokeWidth="5"
                      fill="rgba(255,255,255,0.2)"
                      strokeDasharray={Math.PI * 2 * 45}
                      strokeDashoffset={
                        Math.PI *
                        2 *
                        45 *
                        (1 - (downloadProgress[item.fileName] || 0))
                      }
                    />
                  </Svg>
                  <MaterialIcons
                    name="file-download"
                    size={30}
                    color="#888F05"
                    position="relative"
                    alignSelf="flex-end"
                  />
                </View>
              </TouchableOpacity>
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
        <FontAwesome name="send" size={30} color="#bac308" />
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
          <View style={[styles.attachmentPreview, themeStyles[theme]]}>
            <Text
              numberOfLines={1}
              ellipsizeMode="middle"
              style={[themeStyles[theme]]}
            >
              Selected file: {attachment.name}
            </Text>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <Text
                style={themeStyles[theme]}
              >{`Uploading: ${uploadProgress}%`}</Text>
            )}
          </View>
        )}
        {renderInputContainer()}
      </ImageBackground>
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
  },
  textStyle: {
    alignSelf: "flex-end",
    margin: 10,
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
  sentMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#bac308",
    // backgroundColor: "#DCF8C6",
    padding: 10,
    margin: 5,
    borderRadius: 10,
    maxWidth: "70%",
  },
  receivedMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    padding: 10,
    margin: 5,
    borderRadius: 10,
    maxWidth: "70%",
  },
  svgContainer: {
    position: "relative",
  },
  progressSvg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 10,
    paddingBottom: 0,
  },
  attachbox: {
    borderTopWidth: 20,
    borderTopColor: "#7F8505",
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
    padding: 5,
    backgroundColor: "transparent",
    margin: 10,
    borderRadius: 22,
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
    marginTop: 5,
  },
  attachmentName: {
    flex: 1,
    fontSize: 12,
    color: "#555",
  },
  msgBtn: {
    backgroundColor: "#E4E986",
    width: "50%",
    padding: 5,
    borderRadius: 5,
    margin: 2,
  },
  BtnText: {
    color: "black",
    fontSize: 12,
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
  menuBox: {
    padding: 2,
    top: 1,
  },
  modalView: {
    alignItems: "center",
    marginTop: 20,
    backgroundColor: "transparent",
    padding: 14,
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
