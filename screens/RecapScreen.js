import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

export default function RecapScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>recapScreen</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    display:'flex',
    backgroundColor: '#fbdd74',
    flex:1,
  },
  title:{
    fontSize: 30,
    color:'#004643',
  }
})