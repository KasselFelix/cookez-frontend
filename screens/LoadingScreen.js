import { StyleSheet, View } from "react-native";
import React from "react";
import LoadingPageOne from "../components/LoadingPages";


export default function LoadingScreen() {
  return <View style={styles.container}>{LoadingPageOne}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});