import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";
import LoginScreen from "./srcs/screens/LoginScreen";
import ProfileSetupScreen from "./srcs/screens/ProfileSetupScreen";
import ChatsScreen from "./srcs/screens/ChatsScreen";
import UserScreen from "./srcs/screens/UserScreen";
import SettingsScreen from "./srcs/screens/SettingsScreen";
import ContactsScreen from "./srcs/screens/ContactsScreen";
import ChatRoom from "./srcs/screens/ChatRoom";
import { Ionicons } from "@expo/vector-icons";
import AntDesign from "@expo/vector-icons/AntDesign";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { MenuProvider } from "react-native-popup-menu";
import {
  TTSProvider,
  TranslationProvider,
  AppLangProvider,
} from "./srcs/screens/SettingsScreen";
import {
  ThemeProvider,
  useTheme,
  themeStyles,
} from "./srcs/screens/ThemeContext";
import { initializeLanguage, translate } from "./locale/i18n";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          ...themeStyles[theme],
          borderTopWidth: 1,
          borderTopColor: theme === "light" ? "#e0e0e0" : "#333333",
        },
        tabBarActiveTintColor: theme === "light" ? "#bac308" : "#bac308",
        tabBarInactiveTintColor: theme === "light" ? "#8E8E93" : "#98989D",
        headerStyle: {
          backgroundColor: themeStyles[theme].backgroundColor,
        },
        headerTintColor: themeStyles[theme].color,
      }}
    >
      <Tab.Screen
        name="Chats"
        component={ChatsScreen}
        options={{
          title: translate("screen.chats"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Directory"
        component={ContactsScreen}
        options={{
          title: translate("screen.directory"),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="contacts" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="User"
        component={UserScreen}
        options={{
          title: translate("screen.user"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: translate("screen.settings"),
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="setting" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (initializing) setInitializing(false);
    });

    initializeLanguage();

    return unsubscribe;
  }, []);

  if (initializing) return null;

  return (
    <ThemeProvider>
      <TTSProvider>
        <AppLangProvider>
          <TranslationProvider>
            <MenuProvider>
              <AppContent user={user} />
            </MenuProvider>
          </TranslationProvider>
        </AppLangProvider>
      </TTSProvider>
    </ThemeProvider>
  );
}

function AppContent({ user }) {
  const { theme } = useTheme();

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Main"
        screenOptions={{
          headerStyle: {
            backgroundColor: themeStyles[theme].backgroundColor,
          },
          headerTintColor: themeStyles[theme].color,
          headerTitleStyle: {
            color: themeStyles[theme].color,
          },
        }}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: "Login" }}
        />
        <Stack.Screen
          name="ProfileSetup"
          component={ProfileSetupScreen}
          options={{ title: "Set up Profile" }}
        />
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="ChatRoom" component={ChatRoom} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
