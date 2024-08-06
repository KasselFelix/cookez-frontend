import { Modal, StyleSheet, TextInput, Text, View, TouchableOpacity } from 'react-native';
import React, {useState} from 'react';


export default function LoginScreen({navigation}) {

// signin states for the signin inputs & the modal
const [username, setUsername]=useState('');
const [password, setPassword]=useState('');
const [modalVisible1, setModalVisible1]=useState(false);

// signup states for the signup inputs & the modal
const [email, setEmail]=useState('');
const [firstname, setFirstname]=useState('');
const [lastname, setLastname]=useState('');
const [username2, setUsername2]=useState('');
const [age, setAge]=useState(0); 
const [password2, setPassword2]=useState('');
const [image, setImage]=useState('');
const [modalVisible2, setModalVisible2]=useState(false);


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
  .then(data => {
    console.log('user',data)
    .catch(error => console.error(error));
  })
  setUsername('')
  setPassword('')
}

const handleSignup =() => {
  fetch('http://192.168.100.155:3000/users/signup', {
    method:'POST',
    headers:{'Content-Type': 'Application/json'}, 
    body:JSON.stringify({
      email,firstname,lastname,username,age,password,image
    })
  })
  .then(res => res.json())
  .then(data => {
    console.log({NewUser: data})
  });

}


  return (
    <View style={styles.container}>
      <TouchableOpacity title='Signin' onPress={()=> setModalVisible1(true)}>
      <Text>SignUp</Text>
      </TouchableOpacity>
      <Modal visible={modalVisible1} animationtType="fade" transparent>
      <View style={styles.modal1}>
        <View style={styles.modalContainer1}>
            <TextInput placeholder='email' value={email} onChangeText={(value)=> setEmail(value)}/>
            <TextInput placeholder='firstname' value={firstname} onChangeText={(value)=> setFirstname(value)}/>
            <TextInput placeholder='lastname' value={lastname} onChangeText={(value)=> setLastname(value)}/>
            <TextInput placeholder='username2' value={username2} onChangeText={(value)=> setUsername2(value)}/>
            <TextInput placeholder='age' value={age} onChangeText={(value)=> setAge(value)}/>
            <TextInput placeholder='password2' value={password2} onChangeText={(value)=> setPassword2(value)}/>
            <TextInput placeholder='image' value={image} onChangeText={(value)=> setImage(value)}/>
            <TouchableOpacity title='Signup' onPress={()=>handleSignup()}>
              <Text>Signup</Text>
            </TouchableOpacity>
            <TouchableOpacity title='hide' onPress={()=> setModalVisible1(false)}>
            <Text>Hide</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <TouchableOpacity title='Signup' onPress={()=> setModalVisible2(true)}>
      <Text>Signin</Text>
      </TouchableOpacity>
      <Modal visible={modalVisible2} animationtType="fade" transparent>
      <View style={styles.modal2}>
        <View style={styles.modalContainer2}>
            <TextInput placeholder='username' value={username} onChangeText={(value)=> setUsername(value)}/>
            <TextInput placeholder='password' value={password} onChangeText={(value)=> setPassword(value)}/>
            <TouchableOpacity title='Signin' onPress={()=>handleSignin()}>
              <Text>Signin</Text>
            </TouchableOpacity>
            <TouchableOpacity title='hide' onPress={()=> setModalVisible2(false)}>
            <Text>Hide</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <View>
        <TouchableOpacity name='Go to HomePage' onPress={()=> navigation.navigate('TabNavigator')}>
          <Text>Go to HomePage</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
container: {
  flex:1,
  textAlign:'center',
  alignItems:'center',
  
},
modal1:{
  display:'flex',
  flex:1,
  justifyContent:'center',
  alignItems:'center',
},
modalContainer1:{
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
modal2:{
  display:'flex',
  flex:1,
  justifyContent:'center',
  alignItems:'center',
},
modalContainer2:{
  backgroundColor:'#abd1c6',
  borderRadius:'30%',
  justifyContent:'center',
  alignItems:'center',
  height:'30%',
  width:'60%',
  shadowOpacity:'10px',
},
})