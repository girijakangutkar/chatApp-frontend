import React from "react";
import { Image, StyleSheet } from "react-native";
import { API_URL } from "../config";

const ProfilePicture = ({ uri, style, defaultSource }) => {
  return (
    <Image
      source={{
        uri: uri ? `${API_URL}/${uri}` : undefined,
      }}
      style={[styles.profilePic, style]}
      defaultSource={defaultSource}
    />
  );
};

const styles = StyleSheet.create({
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
});

export default ProfilePicture;
