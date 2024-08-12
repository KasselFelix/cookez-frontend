import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

export default function UserDashboardScreen() {
  return (
    <View style={styles.logoContainer}>
    <Image
        style={styles.logo}
        source={require("../assets/logo/cookez logo.png")}
      />
  </View>
  )
}

const styles = StyleSheet.create({})