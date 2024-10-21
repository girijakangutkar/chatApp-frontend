import { I18n } from "i18n-js";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import english from "./english.json";
import marathi from "./marathi.json";
import konkani from "./konkani.json";
import hindi from "./hindi.json";
import japanese from "./japanese.json";

const i18n = new I18n({
  english,
  marathi,
  konkani,
  hindi,
  japanese,
});

i18n.defaultLocale = "english";
i18n.fallbacks = true;

export const initializeLanguage = async () => {
  const storedLanguage = await AsyncStorage.getItem("appLanguage");
  if (storedLanguage) {
    i18n.locale = storedLanguage;
  } else {
    i18n.locale = Localization.locale.split("-")[0];
  }
};

export const setLanguage = async (language) => {
  i18n.locale = language;
  await AsyncStorage.setItem("appLanguage", language);
};

export const translate = (key, options) => i18n.t(key, options);

export const getCurrentLanguage = () => i18n.locale;

export const getAvailableLanguages = () => Object.keys(i18n.translations);
