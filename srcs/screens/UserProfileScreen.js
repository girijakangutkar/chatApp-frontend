// UserProfileScreen.js
import React, { useState, useEffect } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import axios from "axios";
import { API_URL } from "../config";

export default function UserProfileScreen({ route, navigation }) {
  const { userId } = route.params;
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/users/${userId}`);
      setUserProfile(response.data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  if (!userProfile) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={{
          uri: userProfile.profilePic || "https://via.placeholder.com/150",
        }}
        style={styles.profilePic}
      />
      <Text style={styles.name}>{userProfile.name}</Text>
      <Text style={styles.phoneNumber}>{userProfile.phoneNumber}</Text>
      <Text style={styles.about}>
        {userProfile.about || "No about information"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 20,
  },
  profilePic: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  phoneNumber: {
    fontSize: 18,
    marginBottom: 10,
  },
  about: {
    fontSize: 16,
    textAlign: "center",
  },
});
