//Ignore all log notifications
import { LogBox } from 'react-native';
LogBox.ignoreAllLogs();

// NAVIGATION SETTINGS
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

// STYLES
import FontAwesome from "react-native-vector-icons/FontAwesome";
import css from "./styles/Global";

// STORE SETTINGS
import { Provider } from 'react-redux';
import { configureStore } from "@reduxjs/toolkit";

// ALL SCREENS IMPORTS
import AddRecipeScreen from "./screens/AddRecipeScreen";
import HomeScreen from "./screens/HomeScreen";
import KickoffScreen from "./screens/KickoffScreen";
import LoadingScreen from "./screens/LoadingScreen";
import LoginScreen from "./screens/LoginScreen";
import MessageScreen from "./screens/MessageScreen";
import MoreFeaturesScreen from "./screens/MoreFeaturesScreen";
import ProfileScreen from "./screens/ProfileScreen";
import RecapScreen from "./screens/RecapScreen";
import RecipeScreen from "./screens/RecipeScreen";
import ResultScreen from "./screens/ResultScreen";
import UserDashboardScreen from "./screens/UserDashboardScreen";
import FavoriteScreen from "./screens/FavoriteScreen";
import CommentScreen from "./screens/CommentScreen";

// ALL REDUCERS IMPORTS
import user from './reducers/user';
import recipe from './reducers/recipe';
import comment from './reducers/comment';
import ingredient from "./reducers/ingredient";
import origin from "./reducers/origin"
import picture from "./reducers/picture";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const store = configureStore({
  reducer: { user, recipe, comment ,ingredient, origin, picture},
});

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarStyle:({ 
            height: 60, // Adjust height
            paddingBottom: 0, // Remove padding
            borderTopWidth: 0, // Remove top border
            elevation: 2, // Remove shadow on Android
            backgroundColor: 'transparent', // Make transparent if needed
        }),
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
          // else if (route.name === "SearchRecipe") {
          //   iconName = "search";
          // }

          return <FontAwesome name={iconName} color={color} size={size} />;
        },
        headerShown: false,
        backgroundColor: css.backgroundColorTwo,
        tabBarInactiveBackgroundColor: css.inactiveButtonColor,
        tabBarActiveBackgroundColor: css.backgroundColorTwo,
        tabBarActiveTintColor: css.backgroundColorOne,
        tabBarInactiveTintColor: css.backgroundColorTwo,
        tabBarShowLabel: false,
      })}
    >
      <Tab.Screen name="UserDashboard" component={UserDashboardScreen}/>
      <Tab.Screen name="Favorite" component={FavoriteScreen} />
      <Tab.Screen name="AddRecipe" component={AddRecipeScreen} />
      <Tab.Screen name="Comment" component={CommentScreen} />
      {/* // <Tab.Screen name="SearchRecipe" component={SearchRecipeScreen} /> */}
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default function App() {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{headerShown: false}} >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Favorite" component={FavoriteScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Kickoff" component={KickoffScreen} />
          <Stack.Screen name="Recap" component={RecapScreen} />
          <Stack.Screen name="Loading" component={LoadingScreen} />
          <Stack.Screen name="Result" component={ResultScreen} />
          <Stack.Screen name="Recipe" component={RecipeScreen} />
          <Stack.Screen name="MoreFeatures" component={MoreFeaturesScreen} />
          <Stack.Screen name="UserDashboard" component={UserDashboardScreen} />
          <Stack.Screen name="TabNavigator" component={TabNavigator} />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
}