import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

export default function MessageScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Search Recipe Screen</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    display:'flex',
    backgroundColor: '#fbdd74',
    flex:1,
  },
  text:{
    fontSize: 35,
    color:'#004643',
  }
});