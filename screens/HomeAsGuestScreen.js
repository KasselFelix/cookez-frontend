import { StyleSheet, Text, View, Button } from 'react-native'
import React from 'react'
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import css from '../styles/global';

export default function HomeAsGuest({navigation}) {



  return (
    <View>
      <Text></Text>
      <Button title='Go To LoginScreen' onPress={()=> navigation.navigate('TabNavigator')}/>
    </View>
  )
}

const styles = StyleSheet.create({
  

})