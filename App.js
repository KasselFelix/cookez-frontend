import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import FontAwesome from 'react-native-vector-icons/FontAwesome';



const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabNavigator =() => {
  return (
<Tab.Navigator screenOptions={({route}) => ({
  tabBarIcon:({color,size}) => {

    let iconName='';
    if (route.name==='profile') {
      iconName='faUser'
    } else if (route.name==='message') {
        iconName='faMessage'
    } else if (route.name==='addRecipe') {
      iconName='faPlus'
    } else if (route.name==='whishList') {
      iconName='faHeart'
    } else if(route.name==='searchRecipe') {
      iconName='faMagnifyingGlass'
    }

return <FontAwesome icon={iconName} name='iconTabBar' />
  },
  headersShown:false;
  TabBarActivetintColor:
})}>
  <Tab.Screen name='profile' component={messageScreen}/>
  <Tab.Screen name='message' component={mesage}/>
  <Tab.Screen name='addRecipe' component={addRecipe}/>
  <Tab.Screen name='wishList' component={wishList}/>
  <Tab.Screen name='searchRecipe' component={searchRecipe}/>
</Tab.Navigator>
  )
}


export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={({headersShown:false})}>
        <Stack.Screen name='HomeAsGuest' component={HomeAsGuest}/>
        <Stack.Screen name='loginPage' component={loginPage}/>
        <Stack.Screen name='Kickoff' component={kickoff}/>
        <Stack.Screen name='recap' component={recap}/>
        <Stack.Screen name='loading' component={loading}/>
        <Stack.Screen name='result' component={result}/>
        <Stack.Screen name='recipe' component={recipe}/>
        <Stack.Screen name='moreFeatures' component={moreFeatures}/>
        <Stack.Screen name='userDashboard' component={userDashboard}/>
        <Stack.Screen name='userDashboard' component={userDashboard}/>
        <Stack.Screen name='favorites' component={fa}/>
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
