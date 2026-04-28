import { useState,useEffect } from 'react';
import { Modal, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import addressIp from '../modules/addressIp';
import { addUserToStore } from '../reducers/user';
import buttonStyles from '../styles/Button';
import css from '../styles/Global';
import MyButton from './MyButton';
import LottieView from 'lottie-react-native';

export default function SignIn({navigation}) {
    // signin states for the signin inputs & the modal
    const [username, setUsername]=useState('');
    const [password, setPassword]=useState('');
    const [modalVisible, setModalVisible]=useState(false);
    // hook state to launch the animation
    const [submitted, setSubmitted]=useState(false);

    const dispatch =useDispatch();
    const user=useSelector((state)=>state.user.value)

    // funtion to handle the signin
    const handleSignin = async () => {
      // Optionnel : ajouter un état "isLoading" ici
      try {
        const response = await fetch(`${addressIp}/users/signin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username.trim(),
            password: password,
          }),
        });
        
        const data = await response.json();
        if (data.result) {
          await AsyncStorage.setItem('userToken', data.userLogged.token);
          setSubmitted(true);
          dispatch(addUserToStore(data.userLogged));
        } else {
          alert(data.error);
        }
      } catch (error) {
        console.error('Sign-in failed:', error.message);
        alert("Une erreur réseau est survenue.");
      }
    };

    const handleAnimationFinish =() => {
      setSubmitted(false)
      setModalVisible(false)
      navigation.navigate("TabNavigator", { screen: "UserDashboard" });
    };

  return (
    <SafeAreaView style={styles.buttonWrapper}>
      <MyButton
        dataFlow={()=>setModalVisible(true)}
        text={"SIGN IN"}
        buttonType={buttonStyles.buttonOne}
      />
      <Modal visible={modalVisible} animationType="fade" transparent>
      <View style={styles.modal}>

        {
          submitted ?
          <LottieView
            source={require('../assets/animation/Animation - 1723553895120.json')}
            autoPlay
            loop={false}
            onAnimationFinish={handleAnimationFinish}
            style={styles.lottieAnim}/> 
          :
          <View style={styles.modalContainer}>
          <View style={styles.shadowView}>
            <TextInput placeholder='username' placeholderTextColor={'grey'} style={styles.formStyle} value={username} onChangeText={(value)=> setUsername(value)}/>
            <TextInput placeholder='password' placeholderTextColor={'grey'} textContentType='password' secureTextEntry={true} style={styles.formStyle} value={password} onChangeText={(value)=> setPassword(value)}/>
            <MyButton
              dataFlow={handleSignin}
              text="Signin"
              buttonType={buttonStyles.buttonThree}
            />
            <MyButton
              dataFlow={() => setModalVisible(false)}
              text="Close"
              buttonType={buttonStyles.buttonThree}
            />
          </View>
          </View>
          } 
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  buttonWrapper: {
    width: '100%',
    marginBottom: 5, 
  },
  modal:{
    flex:1,
    justifyContent:'center',
    alignItems:'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer:{
    backgroundColor:css.palette.secondary500,
    borderRadius: 20,
    padding: 20,
    alignItems:'center',
    width:'80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  shadowView:{
    backgroundColor: css.palette.secondary500,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },

  // modalContainerhover:{
  //   scale:'1.3',
  // },
  formStyle: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#264143',
    borderRadius: 10,
    padding: 12,
    marginVertical: 10,
    fontSize: 15,
  },

  lottieAnim:{
    width:'100%',
    height:'100%',
  },
})