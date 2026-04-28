import LottieView from "lottie-react-native";
import { Image, StyleSheet, View } from "react-native";
import MyButton from "../components/MyButton";
import buttonStyles from "../styles/Button";
import css from "../styles/Global";



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
    backgroundColor: css.palette.accent500,
  },

  backgroundLeft: {
    width: "50%",
    height: "100%",
    backgroundColor: css.palette.secondary500,
    position: "absolute",
  },

  logoContainer: {
    flex: 0,
    height: "54%",
    backgroundColor: css.palette.accent500,
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
    backgroundColor: css.palette.secondary500,
    borderTopRightRadius: 180,
    //borderTopLeftRadius: 180,
  },

  buttons: {
    marginBottom: 9,
  },
});
