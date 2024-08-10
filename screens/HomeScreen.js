import { StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";
import React, { useRef } from "react";
import css from "../styles/Global";
import buttonStyles from "../styles/Button";
import MyButton from "../modules/MyButton";

// import { useFonts, } from '@expo-google-fonts/inter';
// import * as SplashScreen from 'expo-splash-screen';
// import {useEffect} from 'react';

// SplashScreen.preventAutoHideAsync();

export default function HomeAsGuest({ navigation }) {
  // const [loaded, error] = useFonts({
  //   'Inter_900Black': require('../assets/fonts/Inter_900Black.ttf'),
  // });

  // useEffect(() => {
  //   if (loaded || error) {
  //     SplashScreen.hideAsync();
  //   }
  // }, [loaded, error]);

  // if (!loaded && !error) {
  //   return null;
  // }

  return (
    <View style={styles.container}>
      <View style={styles.backgroundLeft}></View>

      <View style={styles.logoContainer}>
        <Image
          style={styles.logo}
          source={require("../assets/logo/cookez logo.png")}
        />
      </View>
      <View style={styles.buttonsContainer}>
        <View style={styles.buttons}>
          <MyButton
            dataFlow={() => navigation.navigate("Recipe")}
            text={"RECIPE-SCREEN"}
            buttonType={buttonStyles.buttonTwo}
          />
        </View>
        <View style={styles.buttons}>
          <MyButton
            dataFlow={() => navigation.navigate("Result")}
            text={"RECIP"}
            buttonType={buttonStyles.buttonTwo}
          />
        </View>

        <View style={styles.buttons}>
          <MyButton
            dataFlow={() => navigation.navigate("Kickoff")}
            text={"START"}
            buttonType={buttonStyles.buttonTwo}
          />
        </View>

        <View style={styles.buttons}>
          <MyButton
            dataFlow={() =>
              navigation.navigate("TabNavigator", { screen: "Profil" })
            }
            text={"PROFIL"}
            buttonType={buttonStyles.buttonTwo}
          />
        </View>

        <View style={styles.buttons}>
          <MyButton
            dataFlow={() => navigation.navigate("Login")}
            text={"LOGIN"}
            buttonType={buttonStyles.buttonOne}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: css.backgroundColorOne,
  },

  backgroundLeft: {
    width: "50%",
    height: "100%",
    backgroundColor: css.backgroundColorTwo,
    position: "absolute",
    zIndex: -1,
  },

  logoContainer: {
    flex: 0,
    justifyContent: "center",
    height: "50%",
    backgroundColor: css.backgroundColorOne,
    borderBottomLeftRadius: 180,
  },

  logo: {
    marginTop: 50,
    marginLeft: 40,
    width: 320,
    height: 80,
  },

  buttonsContainer: {
    flex: 0,
    paddingTop: 70,
    height: "100%",
    backgroundColor: css.backgroundColorTwo,
    borderTopRightRadius: 180,
  },

  buttons: {
    marginBottom: 15,
  },
});
