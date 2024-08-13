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
import LottieView from 'lottie-react-native';

export default function LoginScreen({navigation}) {
const [submitted, setSubmitted]=useState(false);


const handleSubmit =() => {
  return  <LottieView style={styles.lottieAnim} source={require("../assets/LXUw0SHQFD.json")}
  autoPlay
  loop
  />
}
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
        <TouchableOpacity onPress={()=>handleSubmit()}>
          <SignUp navigation={navigation} />
        </TouchableOpacity>
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
lottieAnim:{
    width:'97%',
    height:'98%',
},
buttonContainer:{
  marginBottom: 30,
},
btn:{
  width:'100%',
  flexDirection:'row'
}
})
