import { StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";
import React, { useRef } from "react";
import css from "../styles/Global";
import buttonStyles from "../styles/Button";
import MyButton from "../components/MyButton";
import LottieView from "lottie-react-native";



export default function HomeScreen({ navigation }) {

  return (
    <View style={styles.container}>
      <View style={styles.backgroundLeft}></View>

      <View style={styles.logoContainer}>
        <Image
          style={styles.logo}
          source={require("../assets/logo/cookez_logo.png")}
          alt="logo"
          accessibilityLabel="logo"
        />
      </View>
      <LottieView style={styles.lottieAnim} source={require("../assets/animation/Animation - 1723436591199.json")}
      autoPlay
      loop
      />
      
      <View style={styles.buttonsContainer}>

        <View style={styles.buttons}>
          <MyButton
            dataFlow={() => navigation.navigate("Kickoff")}
            text={"START"}
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
    height: "54%",
    backgroundColor: css.backgroundColorOne,
    borderBottomLeftRadius: 180,
  },

  logo: {
    marginTop:90,
    marginLeft: 40,
    width: 320,
    height: 80,
  },

  lottieAnim:{
    height:'80%',
    width:'95%',
    position:'absolute',
  },

  buttonsContainer: {
    flex: 0,
    paddingTop: 20,
    height: "100%",
    backgroundColor: css.backgroundColorTwo,
    borderTopRightRadius: 180,
  },

  buttons: {
    marginBottom: 9,
  },
});
