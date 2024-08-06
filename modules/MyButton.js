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

export default function MyButton({ navigation, navigate, text, buttonType }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 4,
      duration: 100,
      useNativeDriver: false,
    }).start();
  };
  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 0,
      useNativeDriver: false,
      activeIconColor: css.activeButtonColor,
    }).start(() => navigation.navigate("TabNavigator", { screen: "Message" }));
  };

  return (
    <View style={buttonStyles.buttonContainer}>
      <TouchableOpacity
        style={buttonType}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <Animated.View
          style={[
            buttonStyles.hoverOverlay,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        ></Animated.View>
        {/* <LinearGradient
          colors={["#f9bc60", "#6246ea"]}
          style={buttonStyles.hoverOverlay}
        /> */}
        <Text style={buttonStyles.buttonText}>{text}</Text>
      </TouchableOpacity>
    </View>
  );
}
