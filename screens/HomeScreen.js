import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
} from "react-native";
import React, { useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import css from "../styles/Global";
import buttonStyles from "../styles/Button";
import LinearGradient from "react-native-linear-gradient";
// import { LinearGradient } from "expo-linear-gradient";
import MyButton from "../modules/MyButton";

export default function HomeAsGuest({ navigation }) {
  return (
    <View style={styles.container}>
      <MyButton
        navigation={navigation}
        navigate={"Message"}
        text={"START"}
        buttonType={buttonStyles.buttonTwo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
    aI: "center",
    paddingBottom: 30,
  },
});
