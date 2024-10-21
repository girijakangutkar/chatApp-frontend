import { initializeApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBwIDV8Q7Joei88InextOOvsA4XXMb0Xng",
  authDomain: "otpauth-5bc37.firebaseapp.com",
  projectId: "otpauth-5bc37",
  storageBucket: "otpauth-5bc37.appspot.com",
  appId: "1:749460595656:web:c6762f6fa007dbf3d596fd",

  // apiKey: "AIzaSyDC2jXnwMMyaYNvFSWJ1k4hQaRaXYUMTMA",
  // authDomain: "otpauth-fcef9.firebaseapp.com",
  // projectId: "otpauth-fcef9",
  // storageBucket: "otpauth-fcef9.appspot.com",
  // appId: "1:515810084937:web:dbd744cd4d53996bcd9798",

  // apiKey: "AIzaSyD9S_eUS8v8cDRcVVKtDeKctfUKDcGR9AM",
  // authDomain: "auth-with-us.firebaseapp.com",
  // projectId: "auth-with-us",
  // storageBucket: "auth-with-us.appspot.com",
  // appId: "1:751457972449:web:508c172b9573d4374ac7a0",
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
const db = getFirestore(app);

export { app, auth, db };

// import { initializeApp } from "firebase/app";
// import { getFirestore } from "firebase/firestore";
// import {
//   getAuth,
//   initializeAuth,
//   getReactNativePersistence,
// } from "firebase/auth";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// const firebaseConfig = {
//   apiKey: "AIzaSyBwIDV8Q7Joei88InextOOvsA4XXMb0Xng",
//   authDomain: "otpauth-5bc37.firebaseapp.com",
//   projectId: "otpauth-5bc37",
//   storageBucket: "otp749460595656",
//   appId: "1:749460595656:web:c6762f6fa007dbf3d596fd",
// };

// const app = initializeApp(firebaseConfig);
// const auth = initializeAuth(app, {
//   persistence: getReactNativePersistence(AsyncStorage),
// });
// const db = getFirestore(app);

// auth.useEmulator("http://localhost:9099");
// db.useEmulator("localhost", 8080);

// export { app, auth, db };
