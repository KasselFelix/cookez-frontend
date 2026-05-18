import { useCallback,useEffect } from 'react';
import { View } from 'react-native';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// FONTS
import {
  FiraSans_400Regular,
  FiraSans_600SemiBold,
  FiraSans_700Bold,
} from '@expo-google-fonts/fira-sans';
import { Varela_400Regular } from '@expo-google-fonts/varela';
import { VarelaRound_400Regular } from '@expo-google-fonts/varela-round';
import { useFonts } from 'expo-font';

// SPLASH
import * as SplashScreen from 'expo-splash-screen';

// NAVIGATION
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// STYLES
import { FontAwesome } from "@expo/vector-icons";
import css from "./styles/Global";

// STORE
import { configureStore } from "@reduxjs/toolkit";
import { Provider, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import addressIp from './modules/addressIp';
import { addUserToStore } from './reducers/user';
import { setRecipes } from './reducers/recipe';
import { setLocale } from './reducers/locale';
import { setupI18n } from './i18n';
import ThemeProvider from './contexts/ThemeProvider';
import AuthGateProvider from './contexts/AuthGateProvider';

// SCREENS
import AddRecipeScreen from "./screens/AddRecipeScreen";
import CommentScreen from "./screens/CommentScreen";
import FavoriteScreen from "./screens/FavoriteScreen";
import HomeScreen from "./screens/HomeScreen";
import KickoffScreen from "./screens/KickoffScreen";
import LoadingScreen from "./screens/LoadingScreen";
import LoginScreen from "./screens/LoginScreen";
import MessageScreen from "./screens/MessageScreen";
import MoreFeaturesScreen from "./screens/MoreFeaturesScreen";
import NotificationsScreen from "./screens/NotificationsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import PublicProfileScreen from "./screens/PublicProfileScreen";
import RecapScreen from "./screens/RecapScreen";
import RecipeScreen from "./screens/RecipeScreen";
import ResultScreen from "./screens/ResultScreen";
import SettingsScreen from "./screens/SettingsScreen";
import TestScreen from "./screens/TestScreen";
import UserDashboardScreen from "./screens/UserDashboardScreen";

// REDUCERS
import appConfig from './reducers/appConfig';
import comment from './reducers/comment';
import follow from './reducers/follow';
import ingredient from "./reducers/ingredient";
import locale from './reducers/locale';
import notifications from './reducers/notifications';
import pantry from './reducers/pantry';
import picture from "./reducers/picture";
import recipe from './reducers/recipe';
import recipeFilters from "./reducers/recipeFilters";
import user from './reducers/user';

// Keep splash visible until fonts are ready
SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const store = configureStore({
  reducer: {
    user,
    recipe,
    comment,
    ingredient,
    recipeFilters,
    appConfig,
    picture,
    locale,
    notifications,
    follow,
    pantry,
  },
});


const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarStyle: {
          height:          css.tabBar.height,
          paddingBottom:   css.tabBar.paddingBottom,
          paddingTop:      css.tabBar.paddingTop,
          borderTopWidth:  css.tabBar.borderTopWidth,
          elevation:       css.tabBar.elevation,
          backgroundColor: css.tabBar.backgroundColor,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName = "";
          if (route.name === "UserDashboard") {
            iconName = "home";
          } else if (route.name === "Profile") {
            iconName = "user";
          } else if (route.name === "AddRecipe") {
            iconName = "plus";
          } else if (route.name === "Favorite") {
            iconName = "heart";
          } else if (route.name === "Comment") {
            iconName = "comments";
          }
          return <FontAwesome name={iconName} color={color} size={size} />;
        },
        headerShown:             false,
        tabBarActiveTintColor:   css.tabBar.activeTintColor,
        tabBarInactiveTintColor: css.tabBar.inactiveTintColor,
        tabBarShowLabel:         css.tabBar.showLabel,
      })}
    >
      <Tab.Screen name="UserDashboard" component={UserDashboardScreen} />
      <Tab.Screen name="Favorite"      component={FavoriteScreen} />
      <Tab.Screen name="AddRecipe"     component={AddRecipeScreen} />
      <Tab.Screen name="Comment"       component={CommentScreen} />
      <Tab.Screen name="Profile"       component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const AppContent = ({ onLayout}) => {
  const dispatch = useDispatch();
  useEffect(() => {
    const checkToken = async () => {
      // 1. Récupére le token stocké sur le téléphone
      const token = await AsyncStorage.getItem('userToken');

      if (token) {
        try {
          const response = await fetch(`${addressIp}/users/profile/${token}`);
          const data = await response.json();

          if (data.result) {
            // Mettre à jour le store Redux avec TOUTES les données de l'utilisateur
            dispatch(addUserToStore(data.user));
            console.log('Auto-login réussi pour:', data.user.username);
          } else {
            // Si le token est expiré ou invalide côté serveur
            await AsyncStorage.removeItem('userToken');
          }
        } catch (error) {
          console.error('Erreur auto-login:', error);
        }
      }
    };


    const loadAllRecipes = async () => {
      try {
        const response = await fetch(`${addressIp}/recipes/all`);
        const data = await response.json();
        if (data.result) {
          console.log('Recettes chargées:', data.recipes.length);
          dispatch(setRecipes(data.recipes)); // On remplit le store recipe
        }else{
          console.log('chargement recettes échoué:', data.error);
        } 
      } catch (error) {
        console.error('Erreur chargement recettes:', error);
      }
    };

    // Hydrate the i18n singleton from AsyncStorage and mirror the
    // resulting mode into the redux locale slice so React subscribers
    // re-render with the right language.
    const bootstrapI18n = async () => {
      try {
        const mode = await setupI18n();
        dispatch(setLocale(mode));
      } catch (error) {
        console.error('Erreur i18n init:', error);
      }
    };

    checkToken();
    loadAllRecipes();
    bootstrapI18n();
  }, []);
  return (
    <View style={{ flex: 1 }} onLayout={onLayout}>
      <ThemeProvider>
        <NavigationContainer>
          <AuthGateProvider>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Home"          component={HomeScreen} />
              <Stack.Screen name="TabNavigator"  component={TabNavigator} />
              <Stack.Screen name="Favorite"      component={FavoriteScreen} />
              <Stack.Screen name="Login"         component={LoginScreen} />
              <Stack.Screen name="Kickoff"       component={KickoffScreen} />
              <Stack.Screen name="Recap"         component={RecapScreen} />
              <Stack.Screen name="Loading"       component={LoadingScreen} />
              <Stack.Screen name="Result"        component={ResultScreen} />
              <Stack.Screen name="Recipe"        component={RecipeScreen} />
              <Stack.Screen name="MoreFeatures"  component={MoreFeaturesScreen} />
              <Stack.Screen name="UserDashboard" component={UserDashboardScreen} />
              <Stack.Screen name="Settings"      component={SettingsScreen} />
              <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
              <Stack.Screen name="Notifications" component={NotificationsScreen} />
              <Stack.Screen name="Message"       component={MessageScreen} />
              <Stack.Screen name="Test"          component={TestScreen} />
            </Stack.Navigator>
          </AuthGateProvider>
        </NavigationContainer>
      </ThemeProvider>
    </View>
  );
};


export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    FiraSans_400Regular,
    FiraSans_600SemiBold,
    FiraSans_700Bold,
    Varela_400Regular,
    VarelaRound_400Regular,
  });

  // Hide the splash screen only once fonts are ready (or an error occurred)
  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Keep splash visible — return null renders nothing until onLayoutRootView fires
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <AppContent onLayout={onLayoutRootView}/>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
