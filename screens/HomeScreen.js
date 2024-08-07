import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import React, { useRef } from "react";
import css from "../styles/Global";
import buttonStyles from "../styles/Button";
import MyButton from "../modules/MyButton";

export default function HomeAsGuest({ navigation }) {
  return (
    <View style={styles.container}>
      <MyButton
        dataFlow={()=>navigation.navigate("Result")}
        text={"RECIP"}
        buttonType={buttonStyles.buttonTwo}
      />
      <MyButton
        dataFlow={()=>navigation.navigate("Kickoff")}
        text={"START"}
        buttonType={buttonStyles.buttonTwo}
      />
      <MyButton
        dataFlow={()=>navigation.navigate("TabNavigator", {screen: 'Profil'})}
        text={"PROFIL"}
        buttonType={buttonStyles.buttonTwo}
      />
      <MyButton
        dataFlow={()=>navigation.navigate("Login")}
        text={"LOGIN"}
        buttonType={buttonStyles.buttonOne}
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
