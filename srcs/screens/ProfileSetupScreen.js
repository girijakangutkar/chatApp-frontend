import React, { useState } from "react";
import {
  View,
  TextInput,
  Image,
  StyleSheet,
  TouchableOpacity,
  Text,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { API_URL } from "../config";
import Entypo from "@expo/vector-icons/Entypo";
import { auth } from "../../firebaseConfig";

const ProfileSetupScreen = ({ navigation, route }) => {
  const [name, setName] = useState("");
  const [about, setAbout] = useState("");
  const [profileImage, setProfileImage] = useState(null);

  const handleImagePick = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("You've refused to allow this app to access your photos!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };
  // const handleSubmit = async () => {
  //   try {
  //     const currentUser = auth.currentUser;
  //     if (!currentUser) {
  //       throw new Error("No authenticated user found");
  //     }

  //     const formData = new FormData();
  //     formData.append("_id", currentUser.uid);
  //     formData.append("name", name);
  //     formData.append("about", about);
  //     formData.append("phoneNumber", route.params.phoneNumber);
  //     if (profileImage) {
  //       formData.append("profileImage", {
  //         uri: profileImage,
  //         type: "image/jpeg",
  //         name: "profile.jpg",
  //       });
  //     }

  //     const response = await fetch(`${API_URL}/update-profile`, {
  //       method: "POST",
  //       body: formData,
  //     });

  //     if (response.ok) {
  //       const userData = await response.json();
  //       console.log("User created/updated in MongoDB:", userData);
  //       navigation.replace("Main");
  //     } else {
  //       const errorData = await response.json();
  //       throw new Error(errorData.message || "Failed to update profile");
  //     }
  //   } catch (error) {
  //     console.error("Profile update error:", error);
  //     alert(
  //       error.message ||
  //         "An error occurred. Please check your connection and try again."
  //     );
  //   }
  // };

  const handleSubmit = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("No authenticated user found");
      }

      const formData = new FormData();
      formData.append("firebaseUid", currentUser.uid);
      formData.append("_id", currentUser.uid);
      formData.append("name", name);
      formData.append("about", about);
      formData.append("phoneNumber", route.params.phoneNumber);
      if (profileImage) {
        formData.append("profileImage", {
          uri: profileImage,
          type: "image/jpeg",
          name: "profile.jpg",
        });
      }

      const response = await fetch(`${API_URL}/update-profile`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const userData = await response.json();
        console.log("User created/updated in MongoDB:", userData);
        navigation.replace("Main");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      Alert.alert(
        "Profile Update Error",
        error.message ||
          "An error occurred. Please check your connection and try again."
      );
    }
  };

  const removeProfile = async () => {
    setProfileImage("");
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <TouchableOpacity onPress={handleImagePick} style={styles.image}>
          {!profileImage && (
            <TouchableOpacity
              onPress={handleImagePick}
              style={{ position: "absolute", zIndex: 2000 }}
            >
              <Entypo name="circle-with-plus" size={24} color="black" />
            </TouchableOpacity>
          )}
          {!profileImage && (
            <Image
              source={require("../../assets/images/User.png")}
              style={[styles.image, styles.user]}
            />
          )}
          {profileImage && (
            <Image source={{ uri: profileImage }} style={styles.image} />
          )}
          {profileImage && (
            <TouchableOpacity
              onPress={removeProfile}
              style={{ position: "absolute", zIndex: 1000 }}
            >
              <Entypo name="circle-with-cross" size={24} color="black" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="About"
          value={about}
          onChangeText={setAbout}
        />
        <TouchableOpacity
          onPress={handleSubmit}
          style={[styles.btn, styles.send]}
        >
          <Text style={{ fontWeight: "bold" }}>Complete Setup</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    margin: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  image: {
    width: 100,
    height: 100,
    alignSelf: "center",
    marginBottom: 20,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "black",
  },
  user: {
    zIndex: 999,
  },
  btn: {
    margin: 10,
    padding: 10,
    borderRadius: 10,
    alignSelf: "center",
    alignItems: "center",
    borderRadius: 25,
    backgroundColor: "#bac308",
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOpacity: 0.8,
    elevation: 6,
    shadowRadius: 15,
    shadowOffset: { width: 1, height: 13 },
  },
  send: {
    width: "95%",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 8,
    paddingVertical: 45,
    paddingHorizontal: 25,
    width: "100%",
    marginVertical: 10,
    elevation: 10,
    shadowColor: "#52006A",
  },
});

export default ProfileSetupScreen;

// import React, { useState } from "react";
// import {
//   View,
//   TextInput,
//   Image,
//   StyleSheet,
//   TouchableOpacity,
//   Text,
//   Alert,
// } from "react-native";
// import * as ImagePicker from "expo-image-picker";
// import { API_URL } from "../config";
// import Entypo from "@expo/vector-icons/Entypo";
// import { auth } from "../../firebaseConfig";

// const ProfileSetupScreen = ({ navigation, route }) => {
//   const [name, setName] = useState("");
//   const [about, setAbout] = useState("");
//   const [profileImage, setProfileImage] = useState(null);

//   const handleImagePick = async () => {
//     // ... (keep existing image picker logic)
//   };

//   const handleSubmit = async () => {
//     try {
//       const currentUser = auth.currentUser;
//       if (!currentUser) {
//         throw new Error("No authenticated user found");
//       }

//       const formData = new FormData();
//       formData.append("firebaseUid", currentUser.uid);
//       formData.append("_id", currentUser.uid);
//       formData.append("name", name);
//       formData.append("about", about);
//       formData.append("phoneNumber", route.params.phoneNumber);
//       if (profileImage) {
//         formData.append("profileImage", {
//           uri: profileImage,
//           type: "image/jpeg",
//           name: "profile.jpg",
//         });
//       }

//       const response = await fetch(`${API_URL}/update-profile`, {
//         method: "POST",
//         body: formData,
//       });

//       if (response.ok) {
//         const userData = await response.json();
//         console.log("User created/updated in MongoDB:", userData);
//         navigation.replace("Main");
//       } else {
//         const errorData = await response.json();
//         throw new Error(errorData.message || "Failed to update profile");
//       }
//     } catch (error) {
//       console.error("Profile update error:", error);
//       Alert.alert(
//         "Profile Update Error",
//         error.message || "An error occurred. Please check your connection and try again."
//       );
//     }
//   };

//   // ... (keep the rest of the component code)

// };

// // ... (keep the styles)

// export default ProfileSetupScreen;
