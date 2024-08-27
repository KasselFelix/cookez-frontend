import { StyleSheet, View, Text } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import SignIn from '../components/SignIn';
import SignUp from '../components/SignUp';
import MyButton from "../components/MyButton";
import MySmallButton from "../components/MySmallButton";
import buttonStyles from "../styles/Button";
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import css from "../styles/Global";

export default function LoginScreen({navigation}) {
   return (
    <SafeAreaView style={styles.container}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: '15%',
    backgroundColor: css.backgroundColorOne
  }, 

  header: {
    flex: 0,
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },

  titlePage: {
    fontSize: css.fontSizeFive,
  },

  buttonContainer:{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  btn:{
    width: '100%',
    flexDirection: 'row'
  },
})
