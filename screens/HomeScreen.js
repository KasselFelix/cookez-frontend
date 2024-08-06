import { StyleSheet, Text, View, Button } from 'react-native'
import React from 'react'
import css from '../styles/global';

export default function HomeAsGuest({navigation}) {



  return (
    <View>
      <Text></Text>
      <Button title='Go To LoginScreen' onPress={()=> navigation.navigate('loginPage')}/>
      <Button title='Go To Kickoff' onPress={()=> navigation.navigate('TabNavigator')}/>
      <Button title='Go To message' onPress={()=> navigation.navigate('message')}/>
    </View>
  )
}

const styles = StyleSheet.create({
  

})