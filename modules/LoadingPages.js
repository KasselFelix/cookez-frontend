import React from "react";
import css from "../styles/Global";
import { View, StyleSheet, Animated, Easing } from "react-native";
import LinearGradient from "react-native-linear-gradient";

const LoadingPageOne = () => {
  const rotation = new Animated.Value(0);
  const flipAnimation = new Animated.Value(0);
  const shadowScale = new Animated.Value(0.7);

  // Rotation animation
  Animated.loop(
    Animated.timing(rotation, {
      toValue: 1,
      duration: 1700,
      easing: Easing.linear,
      useNativeDriver: true,
    })
  ).start();

  // Flip animation
  Animated.loop(
    Animated.sequence([
      Animated.timing(flipAnimation, {
        toValue: 1,
        duration: 1700,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(flipAnimation, {
        toValue: 0,
        duration: 1700,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ])
  ).start();

  // Shadow animation
  Animated.loop(
    Animated.sequence([
      Animated.timing(shadowScale, {
        toValue: 1,
        duration: 850,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(shadowScale, {
        toValue: 0.7,
        duration: 850,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ])
  ).start();

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "20deg"],
  });

  const flip = flipAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["0deg", "-180deg", "0deg"],
  });

  return (
    <View style={styles.loader}>
      <View style={styles.panWrapper}>
        <Animated.View style={[styles.pan, { transform: [{ rotate }] }]}>
          <Animated.View
            style={[styles.food, { transform: [{ translateY: flip }] }]}
          />
          <View style={styles.panBase} />
          <View style={styles.panHandle} />
        </Animated.View>
        <Animated.View
          style={[styles.panShadow, { transform: [{ scaleX: shadowScale }] }]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  panWrapper: {
    width: 200,
    height: "auto",
    position: "relative",
    alignItems: "flex-start",
    justifyContent: "flex-end",
    flexDirection: "column",
    gap: 20,
  },
  pan: {
    alignItems: "flex-start",
    justifyContent: "flex-start",
    width: "100%",
    height: "auto",
  },
  food: {
    position: "absolute",
    width: "40%",
    height: 6,
  },
  panBase: {
    width: "50%",
    height: 22,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    backgroundColor: css.backgroundColorOne,
  },
  panHandle: {
    width: "40%",
    backgroundColor: "#2c2c2c",
    height: 10,
    borderRadius: 10,
  },
  panShadow: {
    width: 70,
    height: 8,
    backgroundColor: "rgba(0, 0, 0, 0.21)",
    marginLeft: 15,
    borderRadius: 10,
  },
});

export default LoadingPageOne;
