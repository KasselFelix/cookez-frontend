import { StyleSheet, View } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import SignIn from './SignIn';
import SignUp from './SignUp';
import MyButton from "../modules/MyButton";
import MySmallButton from "../modules/MySmallButton";
import buttonStyles from "../styles/Button";
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import css from "../styles/Global";

export default function LoginScreen({navigation}) {
   return (
    <SafeAreaView style={styles.container}>
      <View style={styles.btn}>
        <MySmallButton
          dataFlow={() => navigation.goBack()}
          text={
            <FontAwesome name="angle-double-left" size={30} color={"white"} />
          }
          buttonType={buttonStyles.buttonSmall}
        />
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
  flex:1,
  textAlign:'center',
  justifyContent:'center',
  backgroundColor:css.backgroundColorOne,
  padding:7,
},
buttonContainer:{
  marginBottom: 30,
},
btn:{
  width: '100%',
  flexDirection: 'row'
}
})
