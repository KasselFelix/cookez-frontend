import { Modal, StyleSheet, TextInput, Text, View, TouchableOpacity } from 'react-native';
import React, {useState} from 'react';

import MyButton from '../modules/MyButton';
import buttonStyles from '../styles/Button';
import user, { addUserToStore } from '../reducers/user';
import { useDispatch } from 'react-redux';


export default function SignIn({navigation}) {
    // signin states for the signin inputs & the modal
    const [username, setUsername]=useState('');
    const [password, setPassword]=useState('');
    const [modalVisible, setModalVisible]=useState(false);

    const dispatch =useDispatch();

    // funtion to handle the signin
    const handleSignin =()=> {
        fetch('http://192.168.100.246:3000/users/signin', {
        method:'POST',
        headers:{'Content-Type':'Application/json'},
        body:JSON.stringify({
            username,password
        })
        })
        .then(res => res.json())
        .then(data => {dispatch(addUserToStore(data.userLogged))})
        setUsername('')
        setPassword('')
        navigation.navigate('Home')
    }

  return (
    <View>
      <MyButton
        dataFlow={()=>setModalVisible(true)}
        text={"SIGN IN"}
        buttonType={buttonStyles.buttonOne}
      />
      <Modal visible={modalVisible} animationtType="fade" transparent>
      <View style={styles.modal}>
        <View style={styles.modalContainer}>
            <TextInput placeholder='username' placeholderTextColor={'grey'} KeyboardType={'email-address'} InputModeOptions={'email'} textContentType={'emailAddress'} autoCapitalize={'email'} value={username} onChangeText={(value)=> setUsername(value)}/>
            <TextInput placeholder='password' placeholderTextColor={'grey'} textContentType='password' autoComplete='new-password' secureTextEntry={true} value={password} onChangeText={(value)=> setPassword(value)}/>
            <TouchableOpacity title='Signin' onPress={()=>handleSignin()}>
              <Text>Signin</Text>
            </TouchableOpacity>
            <TouchableOpacity title='hide' onPress={()=> {setModalVisible(false)}}>
            <Text>Hide</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  modal:{
    display:'flex',
    flex:1,
    justifyContent:'center',
    alignItems:'center',
  },
  modalContainer:{
    backgroundColor:'#abd1c6',
    borderRadius: 10,
    justifyContent:'center',
    alignItems:'center',
    height:'30%',
    width:'60%',
    shadowOpacity:'10px',
  },
  modalContainerhover:{
    scale:'1.3',
  },
})