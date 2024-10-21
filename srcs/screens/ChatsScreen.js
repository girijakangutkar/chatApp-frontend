import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import { auth } from "../../firebaseConfig";
import { format, parseISO } from "date-fns";
import { io } from "socket.io-client";
import { API_URL, SOCKET_URL } from "../config";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme, themeStyles } from "./ThemeContext";
const socket = io(SOCKET_URL);

export default function ChatsScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { theme, toggleTheme } = useTheme();

  const fetchConversations = useCallback(
    async (pageNum) => {
      if (loading || (!hasMore && pageNum !== 1)) return;

      setLoading(true);
      try {
        // console.log(`Fetching conversations for page ${pageNum}`);
        const response = await axios.get(
          `${API_URL}/conversations/${auth.currentUser.uid}?page=${pageNum}&limit=20`
        );
        // console.log("Response received:", response.data);
        const newConversations = response.data.conversations;
        setHasMore(response.data.hasMore);

        setConversations((prev) =>
          pageNum === 1 ? newConversations : [...prev, ...newConversations]
        );
        setPage(pageNum);
      } catch (error) {
        console.error("Error fetching conversations:", error);
        if (error.response) {
        } else if (error.request) {
          console.error("Error request:", error.request);
        } else {
          console.error("Error message:", error.message);
        }
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [loading, hasMore]
  );

  useFocusEffect(
    useCallback(() => {
      fetchConversations(1);
    }, [fetchConversations])
  );

  useEffect(() => {
    const handleNewMessage = ({ conversationId, message }) => {
      setConversations((prevConversations) => {
        const conversationIndex = prevConversations.findIndex(
          (conv) => conv._id === conversationId
        );

        if (conversationIndex === -1) {
          fetchConversations(1);
          return prevConversations;
        }

        const updatedConversations = [...prevConversations];
        const updatedConversation = {
          ...updatedConversations[conversationIndex],
          lastMessage: message.content,
          lastMessageTime: message.timestamp,
          unreadCount:
            message.senderId !== auth.currentUser.uid
              ? (updatedConversations[conversationIndex].unreadCount || 0) + 1
              : updatedConversations[conversationIndex].unreadCount || 0,
        };

        updatedConversations.splice(conversationIndex, 1);
        updatedConversations.unshift(updatedConversation);

        return updatedConversations;
      });
    };
    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [fetchConversations]);

  const renderConversationItem = useCallback(
    ({ item }) => {
      const formatTime = (dateString) => {
        if (!dateString) return "";
        try {
          const date = parseISO(dateString);
          return format(date, "h:mm a");
        } catch (error) {
          console.warn("Invalid time format:", dateString);
          return "";
        }
      };

      const lastMessageDisplay =
        item.lastMessageViewOnce && !item.lastMessageViewed
          ? "View Once Message"
          : item.lastMessage;

      return (
        <TouchableOpacity
          style={[styles.conversationItem]}
          onPress={() => {
            navigation.navigate("ChatRoom", {
              conversationId: item._id,
              chatName: item.otherUserName,
              otherUserId: item.otherUserId,
              otherUserProfilePic: item.otherUserProfilePic,
            });
            setConversations((prevConversations) =>
              prevConversations.map((conv) =>
                conv._id === item._id ? { ...conv, unreadCount: 0 } : conv
              )
            );
          }}
        >
          <Image
            source={
              item.otherUserProfilePic
                ? { uri: item.otherUserProfilePic }
                : require("../../assets/images/User.png")
            }
            style={styles.profilePic}
            defaultSource={require("../../assets/images/User.png")}
          />
          <View style={styles.conversationInfo}>
            <View style={styles.nameTimeContainer}>
              <Text
                style={[
                  styles.conversationName,
                  { color: themeStyles[theme].color },
                ]}
              >
                {item.otherUserName}
              </Text>
              <Text
                style={[
                  styles.messageTime,
                  { color: themeStyles[theme].color },
                ]}
              >
                {formatTime(item.lastMessageTime)}
              </Text>
            </View>
            <Text
              style={[styles.lastMessage, { color: themeStyles[theme].color }]}
              numberOfLines={1}
            >
              {lastMessageDisplay}
            </Text>
          </View>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [navigation, theme]
  );

  const loadMoreConversations = useCallback(() => {
    if (hasMore && !loading) {
      fetchConversations(page + 1);
    }
  }, [hasMore, loading, page, fetchConversations]);

  return (
    <View style={[styles.container, themeStyles[theme]]}>
      <FlatList
        data={conversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item._id}
        onEndReached={loadMoreConversations}
        onEndReachedThreshold={0.1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    height: "100%",
  },
  conversationItem: {
    flexDirection: "row",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    alignItems: "center",
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
    backgroundColor: "#e1e1e1", // Light gray background
  },
  conversationInfo: {
    flex: 1,
  },
  nameTimeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  messageTime: {
    fontSize: 12,
  },
  lastMessage: {
    fontSize: 14,
  },
  unreadBadge: {
    backgroundColor: "red",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    right: 10,
    top: 10,
  },
  unreadText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
});
