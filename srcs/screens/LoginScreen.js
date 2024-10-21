import React, { useState, useRef } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  TouchableHighlight,
  Text,
} from "react-native";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { PhoneAuthProvider, signInWithCredential } from "firebase/auth";
import { app, auth } from "../../firebaseConfig";
import PhoneInput from "react-native-phone-number-input";
import AsyncStorage from "@react-native-async-storage/async-storage";
import OTPInput from "./OTPInput";
import AntDesign from "@expo/vector-icons/AntDesign";
import axios from "axios";
import { theme, themeStyles } from "./ThemeContext";
import { API_URL } from "../config";

export default function LoginScreen({ navigation }) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationId, setVerificationId] = useState(null);
  const [verificationCode, setVerificationCode] = useState("");
  const recaptchaVerifier = useRef(null);

  const handleSendVerificationCode = async () => {
    try {
      const phoneProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneProvider.verifyPhoneNumber(
        phoneNumber,
        recaptchaVerifier.current
      );
      setVerificationId(verificationId);
      Alert.alert("Success", "Verification code has been sent to your phone.");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const handleVerifyVerificationCode = async () => {
    try {
      console.log("Starting verification process");
      const credential = PhoneAuthProvider.credential(
        verificationId,
        verificationCode
      );
      console.log("Credential created");
      const userCredential = await signInWithCredential(auth, credential);
      console.log("User signed in");
      const user = userCredential.user;

      await AsyncStorage.setItem("userPhoneNumber", user.phoneNumber);

      const response = await axios.post(`${API_URL}/auth/check-user`, {
        phoneNumber: user.phoneNumber,
      });

      if (response.data.userExists) {
        console.log("Existing user");
        navigation.replace("Main");
      } else {
        console.log("New user");
        navigation.navigate("ProfileSetup", {
          phoneNumber: user.phoneNumber,
        });
      }
    } catch (error) {
      console.error("Detailed error:", error);
      Alert.alert("Error", error.message);
    }
  };

  const handleBack = () => {
    setVerificationId(null);
    setVerificationCode("");
  };

  return (
    <View style={[styles.container, themeStyles[theme]]}>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={app.options}
        attemptInvisibleVerification={true}
      />
      {!verificationId ? (
        <View style={[styles.card, themeStyles[theme]]}>
          <TouchableHighlight style={styles.input}>
            <PhoneInput
              onChangeFormattedText={(text) => {
                setPhoneNumber(text);
              }}
              value={phoneNumber}
              defaultCode="IN"
              layout="first"
              keyboardType="phone-pad"
              autoCompleteType="tel"
              autoFocus
            />
          </TouchableHighlight>
          <TouchableOpacity
            style={[styles.btn, styles.send]}
            onPress={handleSendVerificationCode}
            disabled={!phoneNumber}
          >
            <Text style={{ fontWeight: "bold" }}>Send Verification Code</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.card, themeStyles[theme]]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text>
              <AntDesign name="back" size={20} color="black" />
              &nbsp;&nbsp;Back
            </Text>
          </TouchableOpacity>
          <OTPInput
            verificationCode={verificationCode}
            setVerificationCode={setVerificationCode}
          />
          <TouchableOpacity
            style={[styles.btn, styles.confirm]}
            onPress={handleVerifyVerificationCode}
            disabled={!verificationCode}
          >
            <Text style={[{ fontWeight: "bold" }, themeStyles[theme]]}>
              Confirm verification code
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  input: {
    backgroundColor: "white",
    borderColor: "gray",
    padding: 10,
    marginBottom: 10,
    alignSelf: "center",
  },
  backButton: {
    alignSelf: "flex-start",
    padding: 10,
    marginBottom: 10,
    marginLeft: 30,
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
  confirm: {
    width: "85%",
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
