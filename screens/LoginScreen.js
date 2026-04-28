import { FontAwesome } from "@expo/vector-icons";
import { StyleSheet, View } from 'react-native';
import MySmallButton from "../components/MySmallButton";
import SignIn from '../components/SignIn';
import SignUp from '../components/SignUp';
import buttonStyles from "../styles/Button";
import css from "../styles/Global";

export default function LoginScreen({navigation}) {
   return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MySmallButton
          dataFlow={() => navigation.goBack()}
          text={<FontAwesome name="angle-double-left" size={30} color={"white"} />}
          buttonType={buttonStyles.buttonSmall}
        />
        <View style={styles.btnEmpty}></View>
      </View>
      <View style={styles.buttonContainer}>
        <SignIn navigation={navigation} style={styles.signin}/>
        <SignUp navigation={navigation} style={styles.signup}/>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: '15%',
    backgroundColor: css.palette.accent500
  }, 

  header: {
    flex: 0,
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },

  titlePage: {
    fontSize: css.typography.h5Size,
  },

  buttonContainer:{
    flex: 1,
      width: '90%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  btn:{
    width: '100%',
    flexDirection: 'row'
  },
})
