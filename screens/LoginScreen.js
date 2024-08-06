import { StyleSheet, TextInput, View, TouchableOpacity } from 'react-native';
import React, {useState} from 'react';
import Modal from 'react-native-modal';


export default function LoginScreen({navigation}) {

// signin states for the signin inputs & the modal
const [username, setUsername]=useState('');
const [password, setPassword]=useState('');
const [modalVisible, setModalVisible]=useState(false)

const handleModal =() => {
  setModalVisible(() =>!modalVisible)
}


// funtion to handle the signin
const handleSignin =()=> {
  fetch('http://localhost:3000/users/signin', {
    method:'POST',
    headers:{'Content-Type':'Application/json'},
    body:JSON.stringify({
      username,password
    })
  });
  setUsername('')
  setPassword('')
}

  return (
    <View style={styles.container}>
      <TouchableOpacity title='Signin' onpress={()=> handleModal()}/>
      <Modal visible={modalVisible}>
        <TextInput placeholder='username' value={username} onChangeText={(value)=> setUsername(value)}/>
        <TextInput placeholder='password' value={password} onChangeText={(value)=> setPassword(value)}/>
        <TouchableOpacity title='Signin' onPress={()=>handleSignin()}/>
        <TouchableOpacity title='hide' onPress={()=> handleModal()}/>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
container: {
  display:'flex',
  flexDirection:'column',
}

})