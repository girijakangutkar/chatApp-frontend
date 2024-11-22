import { initializeApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_KEY, AUTH_DOMAIN, PROJECTID, STORAGE_BUCKET, APP_ID } from "@env";

const firebaseConfig = {
  apiKey: { API_KEY },
  authDomain: { AUTH_DOMAIN },
  projectId: { PROJECTID },
  storageBucket: { STORAGE_BUCKET },
  appId: { APP_ID },
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export { app, auth };
