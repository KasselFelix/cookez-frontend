import { StyleSheet, Text, View } from "react-native";
import React from "react";

import css from "../styles/Global";

export default function RecipeScreen() {
  return (
    <View style={styles.container}>
      <Text>recipeScreen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: css.backgroundColorOne,
  },
});
