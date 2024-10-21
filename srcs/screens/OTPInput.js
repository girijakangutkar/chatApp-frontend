import React, { useRef, useEffect } from "react";
import { View, TextInput, StyleSheet } from "react-native";

const OTPInput = ({ verificationCode, setVerificationCode }) => {
  const inputRefs = useRef([]);

  const handleChange = (text, index) => {
    const newCode = verificationCode.split("");
    newCode[index] = text;
    setVerificationCode(newCode.join(""));

    if (text.length === 1 && index < 5) {
      inputRefs.current[index + 1].focus();
    } else if (text.length === 0 && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (
      e.nativeEvent.key === "Backspace" &&
      index > 0 &&
      !verificationCode[index]
    ) {
      inputRefs.current[index - 1].focus();
      const newCode = verificationCode.slice(0, -1);
      setVerificationCode(newCode);
    }
  };

  useEffect(() => {
    if (verificationCode.length === 0) {
      inputRefs.current[0].focus();
    }
  }, [verificationCode]);

  return (
    <View style={styles.otpContainer}>
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <TextInput
          key={index}
          style={styles.otpInput}
          maxLength={1}
          keyboardType="number-pad"
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          ref={(ref) => (inputRefs.current[index] = ref)}
          value={verificationCode[index] || ""}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
    alignSelf: "center",
    marginBottom: 20,
  },
  otpInput: {
    width: 40,
    height: 40,
    borderBottomWidth: 2,
    borderColor: "#000000",
    borderRadius: 5,
    fontSize: 20,
    color: "#000000",
    textAlign: "center",
  },
});

export default OTPInput;
