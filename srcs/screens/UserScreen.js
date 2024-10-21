import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { signOut } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme, themeStyles } from "./ThemeContext";
const API_URL = "http://192.168.1.4:3000";

export default function UserScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [about, setAbout] = useState("");
  const [tempProfileImage, setTempProfileImage] = useState(null);
  const { theme, toggleTheme } = useTheme();

  const fetchUserData = useCallback(async () => {
    try {
      // setLoading(true);
      const phoneNumber = await AsyncStorage.getItem("userPhoneNumber");
      if (phoneNumber) {
        const formattedPhoneNumber = phoneNumber.replace("+", "");
        const url = `${API_URL}/api/user?phoneNumber=${encodeURIComponent(
          formattedPhoneNumber
        )}`;
        const response = await axios.get(url);
        const userData = response.data;
        if (userData) {
          setUser(userData);
          setName(userData.name || "");
          setAbout(userData.about || "");
          setTempProfileImage(null);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      // setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [fetchUserData])
  );

  // useEffect(() => {
  //   fetchUserDate();
  // })

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={showLogoutMenu}>
          <MaterialCommunityIcons
            name="logout"
            size={24}
            color="red"
            style={{ marginRight: 15 }}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleSaveProfile = async () => {
    try {
      const phoneNumber = await AsyncStorage.getItem("userPhoneNumber");
      if (phoneNumber) {
        const formData = new FormData();
        formData.append("phoneNumber", phoneNumber);
        formData.append("name", name);
        formData.append("about", about);

        if (tempProfileImage) {
          formData.append("profileImage", {
            uri: tempProfileImage,
            type: "image/jpeg",
            name: "profile.jpg",
          });
        }

        await axios.post(`${API_URL}/api/update-profile`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        Alert.alert("Success", "Profile updated successfully");
        fetchUserData();
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    }
  };

  const handleChangePhoto = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setTempProfileImage(result.assets[0].uri);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem("userPhoneNumber");
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (error) {
      console.error("Error signing out: ", error);
      Alert.alert("Logout Error", "Failed to log out. Please try again.");
    }
  };

  const showLogoutMenu = () => {
    Alert.alert(
      "Logout",
      "Do you want to logout",
      [
        {
          text: "Logout",
          onPress: () => {
            Alert.alert(
              "Confirm Logout",
              "Are you sure you want to log out?",
              [
                { text: "No", style: "cancel" },
                { text: "Yes", onPress: handleLogout },
              ],
              { cancelable: false }
            );
          },
        },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  if (!user) {
    return (
      <View style={[styles.container, themeStyles[theme]]}>
        <Text style={themeStyles[theme]}>
          No user data available. Please wait...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, themeStyles[theme]]}>
      <TouchableOpacity onPress={handleChangePhoto}>
        <Image
          source={{
            uri:
              tempProfileImage ||
              (user.profileImage
                ? `${API_URL}/${user.profileImage}`
                : "https://via.placeholder.com/150"),
          }}
          style={styles.profilePhoto}
          onError={(e) =>
            console.log("Image loading error:", e.nativeEvent.error)
          }
        />
      </TouchableOpacity>
      <Text style={themeStyles[theme]}>{user.phoneNumber}</Text>
      <TextInput
        style={[styles.input, themeStyles[theme]]}
        value={name}
        onChangeText={setName}
        placeholder="Name"
      />
      <TextInput
        style={[styles.input, themeStyles[theme]]}
        value={about}
        onChangeText={setAbout}
        placeholder="About"
      />
      <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
        <Text style={styles.buttonText}>Save Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  profilePhoto: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
  },
  input: {
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    padding: 10,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
});
