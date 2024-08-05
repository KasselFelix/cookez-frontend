import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import FontAwesome from 'react-native-vector-icons/FontAwesome';


import AddRecipeScreen from './screens/AddRecipeScreen';
import HomeAsGuestScreen from './screens/HomeAsGuestScreen';
import KickoffScreen from './screens/KickoffScreen';
import LoadingScreen from './screens/LoadingScreen';
import LoginScreen from './screens/LoginScreen';
import MessageScreen from './screens/MessageScreen';
import MoreFeaturesScreen from './screens/MoreFeaturesScreen';
import ProfileScreen from './screens/ProfileScreen';
import RecapScreen from './screens/RecapScreen';
import RecipeScreen from './screens/RecipeScreen';
import ResultScreen from './screens/ResultScreen';
import SearchRecipeScreen from './screens/SearchRecipeScreen';
import UserDashboardScreen from './screens/UserDashboardScreen';
import WishListScreen from './screens/WishListScreen';



const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabNavigator =() => {
  return (
<Tab.Navigator screenOptions={({route}) => ({
  tabBarIcon:({color,size}) => {

    let iconName='';
    if (route.name==='profile') {
      iconName='user';
    } else if (route.name==='message') {
        iconName='comment-o';
    } else if (route.name==='addRecipe') {
      iconName='plus';
    } else if (route.name==='wishList') {
      iconName='heart-o';
    } else if(route.name==='searchRecipe') {
      iconName='search';
    }

return <FontAwesome name={iconName} color={color} size={size} />
  },
  headersShown:false,
  TabBarActiveTintColor:'#FFFFFF',
  TabBarInactiveTintColor:'#ABD1C6',
})}>
  <Tab.Screen name='profile' component={ProfileScreen}/>
  <Tab.Screen name='message' component={MessageScreen}/>
  <Tab.Screen name='addRecipe' component={AddRecipeScreen}/>
  <Tab.Screen name='wishList' component={WishListScreen}/>
  <Tab.Screen name='searchRecipe' component={SearchRecipeScreen}/>
</Tab.Navigator>
  )
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={({headersShown:false})}>
        <Stack.Screen name='HomeAsGuest' component={HomeAsGuestScreen}/>
        <Stack.Screen name='loginPage' component={LoginScreen}/>
        <Stack.Screen name='Kickoff' component={KickoffScreen}/>
        <Stack.Screen name='recap' component={RecapScreen}/>
        <Stack.Screen name='loading' component={LoadingScreen}/>
        <Stack.Screen name='result' component={ResultScreen}/>
        <Stack.Screen name='recipe' component={RecipeScreen}/>
        <Stack.Screen name='moreFeatures' component={MoreFeaturesScreen}/>
        <Stack.Screen name='userDashboard' component={UserDashboardScreen}/>
        <Stack.Screen name='TabNavigator' component={TabNavigator}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
