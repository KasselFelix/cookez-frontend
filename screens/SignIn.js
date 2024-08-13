import { Modal, StyleSheet, TextInput, Text, View} from 'react-native';
import React, {useState} from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import MyButton from '../modules/MyButton';
import buttonStyles from '../styles/Button';
import css from '../styles/Global';
import LottieView from "lottie-react-native";


export default function SignIn({navigation}) {
    // signin states for the signin inputs & the modal
    const [username, setUsername]=useState('');
    const [password, setPassword]=useState('');
    const [modalVisible, setModalVisible]=useState(false);

    // hook state to launch the animation
    const [submitted, setSubmitted]=useState(false);

    // funtion to handle the signin
    const handleSignin =()=> {
        fetch('http://192.168.100.155:3000/users/signin', {
        method:'POST',
        headers:{'Content-Type':'Application/json'},
        body:JSON.stringify({
            username,password
        })
        })
        .then(res => res.json())
        .then((data) => {
          if (data.result) {
            setSubmitted(true);
          } else {
            throw new Error(data.message || 'Something went wrong 🧐');      
          }
        })
        .catch((error) => {
          console.error('Sign-in failed', error.message);
          Alert.alert("Error", data.message)
        })
    };

    const handleAnimationFinish =() => {
      setSubmitted(false)
      setModalVisible(false)
      setTimeout(() => {
        navigation.navigate('UserDashboard');
      }, 900);
    };

  return (
    <SafeAreaView style={styles.buttonWrapper}>
      <MyButton
        dataFlow={()=>setModalVisible(true)}
        text={"SIGN IN"}
        buttonType={buttonStyles.buttonOne}
      />
      <Modal visible={modalVisible} animationtType="fade" transparent>
      <View style={styles.modal}>

        {
          submitted ?
          <LottieView
            source={require('../assets/Animation - 1723553895120.json')}
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
    marginBottom: 5, 
  },
  modal:{
    flex:1,
    justifyContent:'center',
    alignItems:'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer:{
    backgroundColor:'#abd1c6',
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
    backgroundColor: '#abd1c6',
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