import { Modal, StyleSheet, TextInput, Text, View, TouchableOpacity } from 'react-native';
import React, {useState} from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import SignIn from './SignIn';
import SignUp from './SignUp';
import MyButton from '../modules/MyButton';
import MySmallButton from '../modules/MySmallButton';
import buttonStyles from '../styles/Button';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import css from '../styles/Global';

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
        <SignIn navigation={navigation} />
        <SignUp navigation={navigation} />
      </View>
      <MyButton
        dataFlow={() => navigation.navigate('TabNavigator')}
        text={"Go to HomePage"}
        buttonType={buttonStyles.buttonOne}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
container: {
  flex:1,
  justifyContent: 'center',
  backgroundColor: css.backgroundColorTwo ,
  alignItems:'center',
  padding: 20,
},
buttonContainer:{
  marginBottom: 30,
},
btn:{
  width:'100%',
  flexDirection:'row'
}
})
