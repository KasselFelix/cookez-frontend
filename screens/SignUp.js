import { Modal, StyleSheet, TextInput, Text, View, TouchableOpacity } from 'react-native';
import React, {useState} from 'react';

import MyButton from '../modules/MyButton';
import buttonStyles from '../styles/Button';

export default function SignUp({navigation}) {
    const [email, setEmail]=useState('');
    const [firstname, setFirstname]=useState('');
    const [lastname, setLastname]=useState('');
    const [username, setUsername]=useState('');
    const [age, setAge]=useState(0); 
    const [password, setPassword]=useState('');
    const [image, setImage]=useState('');
    const [modalVisible, setModalVisible]=useState(false);

    const handleSignup =() => {
        fetch('http://192.168.100.155:3000/users/signup', {
            method:'POST',
            headers:{'Content-Type': 'Application/json'}, 
            body:JSON.stringify({
            email:email,
            firstname:firstname,
            lastname:lastname,
            username: username,
            age:age,
            password: password,
            image:image,
            })
        })
        .then(res => res.json())
        .then(data => {console.log('user', data)})
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
                {/*lire la doc pour specifier les options manquante */}
                <TextInput placeholder='email' placeholderTextColor={'grey'}  KeyboardType={'email-address'} InputModeOptions={'email'} textContentType={'emailAddress'} autoCapitalize={'email'} value={email} onChangeText={(value)=> setEmail(value)}/>
                <TextInput placeholder='firstname' placeholderTextColor={'grey'} value={firstname} onChangeText={(value)=> setFirstname(value)}/>
                <TextInput placeholder='lastname' placeholderTextColor={'grey'} value={lastname} onChangeText={(value)=> setLastname(value)}/>
                <TextInput placeholder='username' placeholderTextColor={'grey'} value={username} onChangeText={(value)=> setUsername(value)}/>
                <TextInput placeholder='age' placeholderTextColor={'grey'} value={age} onChangeText={(value)=> setAge(value)}/>
                <TextInput placeholder='password' placeholderTextColor={'grey'} textContentType='password' autoComplete='new-password' secureTextEntry={true} value={password} onChangeText={(value)=> setPassword(value)}/>
                <TextInput placeholder='image' placeholderTextColor={'grey'} value={image} onChangeText={(value)=> setImage(value)}/>
                <TouchableOpacity title='Signup' onPress={()=> handleSignup()}>
                <Text>Signup</Text>
                </TouchableOpacity>
                <TouchableOpacity title='hide' onPress={()=> setModalVisible(false)}>
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
        borderRadius:'30%',
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