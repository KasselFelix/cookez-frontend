import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

export default function KickoffScreen() {
  return (
    <View style={styles.container}>
      <Text>KickoffScreen</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    
  }

})