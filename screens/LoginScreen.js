import { StyleSheet, Text, View, Button } from 'react-native'
import React from 'react'
import KickoffScreen from './KickoffScreen'

export default function LoginScreen({navigation}) {
  return (
    <View>
      <Text>Go To Kickoff</Text>
      <Button title='Go to Kickoff' onPress={()=> navigation.navigate({KickoffScreen})}/>
    </View>
  )
}

const styles = StyleSheet.create({})