import React, { useLayoutEffect, useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Image,
} from "react-native";
import { useTheme, themeStyles } from "./ThemeContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import {
  translate,
  setLanguage,
  getCurrentLanguage,
  getAvailableLanguages,
} from "../../locale/i18n";
import { supportedLanguages } from "./TranslationService";

export const TTSContext = React.createContext();
export const TranslationContext = React.createContext();
export const AppLangContext = React.createContext();

export function TTSProvider({ children }) {
  const [ttsEnabled, setTTSEnabled] = useState(false);

  const toggleTTS = async () => {
    const newValue = !ttsEnabled;
    setTTSEnabled(newValue);
    await AsyncStorage.setItem("ttsEnabled", JSON.stringify(newValue));
  };

  return (
    <TTSContext.Provider value={{ ttsEnabled, toggleTTS }}>
      {children}
    </TTSContext.Provider>
  );
}

export function AppLangProvider({ children }) {
  const [appLanguage, setAppLanguage] = useState(getCurrentLanguage());

  const handleLanguageChange = async (language) => {
    await setLanguage(language);
    setAppLanguage(language);
  };

  return (
    <AppLangContext.Provider value={{ appLanguage, handleLanguageChange }}>
      {children}
    </AppLangContext.Provider>
  );
}

export function TranslationProvider({ children }) {
  const [targetLanguage, setTargetLanguage] = useState("en");

  const changeTargetLanguage = async (language) => {
    setTargetLanguage(language);
    await AsyncStorage.setItem("targetLanguage", language);
  };

  return (
    <TranslationContext.Provider
      value={{ targetLanguage, changeTargetLanguage }}
    >
      {children}
    </TranslationContext.Provider>
  );
}

export default function SettingsScreen({ navigation }) {
  const { theme, toggleTheme } = useTheme();
  const { ttsEnabled, toggleTTS } = useContext(TTSContext);
  const { targetLanguage, changeTargetLanguage } =
    useContext(TranslationContext);
  const { appLanguage, handleLanguageChange } = useContext(AppLangContext);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={toggleTheme} style={styles.button}>
          {theme === "dark" ? (
            <MaterialIcons name="sunny" size={24} color="white" />
          ) : (
            <Ionicons name="moon" size={24} color="#f5dd4b" />
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, theme]);

  return (
    <View style={[styles.container, themeStyles[theme]]}>
      <View style={styles.settingRow}>
        <Text style={[styles.texts, themeStyles[theme]]}>
          {translate("page.appVersion")}&nbsp;&nbsp; ({translate("1-0-4")})
        </Text>
        <Image
          style={{ width: 50, height: 50, marginRight: 30, borderRadius: 10 }}
          source={{
            uri: "https://i.ibb.co/vk2r5sb/icons.png",
          }}
        />
      </View>
      <View style={styles.settingRow}>
        <Text style={[styles.texts, themeStyles[theme]]}>
          {translate("page.appLanguage")}
        </Text>
        <Picker
          selectedValue={appLanguage || "ENGLISH"}
          style={[styles.picker, themeStyles[theme]]}
          onValueChange={(itemValue) => handleLanguageChange(itemValue)}
        >
          {getAvailableLanguages().map((lang) => (
            <Picker.Item key={lang} label={lang.toUpperCase()} value={lang} />
          ))}
        </Picker>
      </View>
      <View style={styles.settingRow}>
        <Text style={[styles.texts, themeStyles[theme]]}>
          {translate("page.Translateto")}
        </Text>
        <Picker
          selectedValue={targetLanguage}
          style={[styles.picker, themeStyles[theme]]}
          onValueChange={(itemValue) => changeTargetLanguage(itemValue)}
        >
          {/* if(Platform.OS === 'android' && this.state.selectedIndex === -1){" "}
          {<Picker.Item label={"CANCEL"} value={-1} />} */}
          {/* {supportedLanguages.map((lang) => (
            <Picker.Item
              key={lang.code}
              label={lang.name}
              value={lang.code}
              style={[themeStyles[theme]]}
            />
          ))} */}

          {supportedLanguages.map((lang, index) => {
            if (index === 0) {
              return (
                <Picker.Item
                  key={null}
                  label={"Off"}
                  value={null}
                  style={[themeStyles[theme]]}
                />
              );
            }
            return (
              <Picker.Item
                key={lang.code}
                label={lang.name}
                value={lang.code}
                style={[themeStyles[theme]]}
              />
            );
          })}
        </Picker>
      </View>
      <View style={styles.settingRow}>
        <Text style={[styles.texts, themeStyles[theme]]}>
          {translate("page.chatToSpeech")}
        </Text>
        <Switch
          value={ttsEnabled}
          onValueChange={toggleTTS}
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={ttsEnabled ? "#f5dd4b" : "#f4f3f4"}
        />
      </View>
      <Text style={styles.warn}>
        please press the speaker icon To hear out your chats in your chatroom.
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 10,
  },
  button: {
    padding: 10,
    marginRight: 10,
  },
  texts: {
    marginTop: 20,
    fontWeight: "bold",
  },
  picker: {
    height: 50,
    width: 150,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  languageSelector: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  warn: {
    color: "black",
    fontWeight: "bold",
    marginTop: 30,
    padding: 5,
    margin: 2,
    alignItems: "left",
    backgroundColor: "#f5dd4b",
    borderRadius: 10,
  },
});
