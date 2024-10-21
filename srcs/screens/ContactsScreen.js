import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from "react-native";
import * as Contacts from "expo-contacts";
import axios from "axios";
import { auth } from "../../firebaseConfig";
import { API_URL } from "../config";
import { useTheme, themeStyles } from "./ThemeContext";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useFocusEffect } from "@react-navigation/native";

const standardizePhoneNumber = (phoneNumber) => {
  let cleaned = phoneNumber.replace(/\D/g, "");
  if (!cleaned.startsWith("91")) {
    cleaned = "91" + cleaned;
  }
  if (cleaned.length > 12) {
    cleaned = cleaned.slice(-12);
  }
  return "+" + cleaned;
};

export default function ContactsScreen({ navigation }) {
  const [contacts, setContacts] = useState([]);
  const [appUsers, setAppUsers] = useState({});
  const { theme, toggleTheme } = useTheme();

  const loadContactsAndSync = useCallback(async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === "granted") {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
      });
      if (data.length > 0) {
        const contactsWithPhones = data.filter(
          (contact) => contact.phoneNumbers && contact.phoneNumbers.length > 0
        );
        setContacts(contactsWithPhones);
        await syncContacts(contactsWithPhones);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadContactsAndSync();
    }, [loadContactsAndSync])
  );

  const renderContactItem = ({ item }) => {
    const phoneNumber = standardizePhoneNumber(item.phoneNumbers[0].number);
    const isAppUser = appUsers[phoneNumber];

    return (
      <TouchableOpacity
        style={[styles.contactItem, themeStyles[theme]]}
        onPress={() => startConversation(phoneNumber)}
      >
        <View>
          <Text style={[styles.contactName, themeStyles[theme]]}>
            {item.name}
          </Text>
          <Text style={[styles.contactNumber, themeStyles[theme]]}>
            {phoneNumber}
          </Text>
        </View>
        {isAppUser ? (
          <Ionicons name="chatbox" size={24} color="#4CAF50" />
        ) : (
          <MaterialCommunityIcons name="email-send" size={24} color="#Ffa500" />
        )}
      </TouchableOpacity>
    );
  };

  const startConversation = async (phoneNumber) => {
    const isAppUser = appUsers[phoneNumber];
    if (isAppUser) {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error("Current user not authenticated");
        }

        const contactUser = appUsers[phoneNumber];
        if (!contactUser) {
          throw new Error("Contact user not found");
        }

        console.log("Starting conversation with:", phoneNumber);
        console.log("Current user ID:", currentUser.uid);
        console.log("Contact user ID:", contactUser._id);

        const response = await axios.post(`${API_URL}/conversations`, {
          participants: [currentUser.uid, contactUser._id],
        });

        console.log("Server response");

        navigation.navigate("ChatRoom", {
          conversationId: response.data._id,
          chatName: contactUser.name || phoneNumber,
        });
        // setTimeout(() => {
        //   navigation.navigate("Chats");
        // }, 100);
      } catch (error) {
        console.error("Error starting conversation:", error.message);
        Alert.alert("Error", "Failed to start conversation. Please try again.");
      }
    }
  };

  const syncContacts = async (contactsToSync) => {
    try {
      const phoneNumbers = contactsToSync.map((contact) =>
        standardizePhoneNumber(contact.phoneNumbers[0].number)
      );

      const response = await axios.get(`${API_URL}/users/search`, {
        params: { phoneNumbers: phoneNumbers.join(",") },
      });
      setAppUsers(response.data);
    } catch (error) {
      console.error("Error syncing contacts:", error);
      Alert.alert("Error", "Failed to sync contacts. Please try again.");
    }
  };

  const sortedContacts = contacts.sort((a, b) => {
    const aIsAppUser =
      appUsers[standardizePhoneNumber(a.phoneNumbers[0].number)];
    const bIsAppUser =
      appUsers[standardizePhoneNumber(b.phoneNumbers[0].number)];
    if (aIsAppUser && !bIsAppUser) return -1;
    if (!aIsAppUser && bIsAppUser) return 1;
    return 0;
  });

  return (
    <View style={[styles.container, themeStyles[theme]]}>
      <TouchableOpacity style={styles.syncButton} onPress={loadContactsAndSync}>
        <FontAwesome5 name="sync-alt" size={28} color="dodgerblue" />
      </TouchableOpacity>
      <FlatList
        data={sortedContacts}
        renderItem={renderContactItem}
        keyExtractor={(item, index) => `contact-${index}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  syncButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 25,
    marginLeft: "83%",
    marginTop: "165%",
    position: "absolute",
    zIndex: 1000,
  },
  syncButtonText: {
    color: "#007AFF",
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    padding: 10,
    backgroundColor: "#e0e0e0",
  },
  contactItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  contactName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  contactNumber: {
    fontSize: 14,
    color: "#666",
  },
});
