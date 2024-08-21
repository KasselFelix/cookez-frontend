import {Modal, StyleSheet, TextInput, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import React, {useState} from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import MyButton from '../modules/MyButton';
import buttonStyles from '../styles/Button';
import css from '../styles/Global';
import { addUserToStore } from '../reducers/user';
import { useDispatch } from 'react-redux';
import addressIp from '../modules/addressIp';
import LottieView from "lottie-react-native";

export default function SignUp({navigation}) {
    const [email, setEmail]=useState('');
    const [firstname, setFirstname]=useState('');
    const [lastname, setLastname]=useState('');
    const [username, setUsername]=useState('');
    const [age, setAge]=useState(0); 
    const [password, setPassword]=useState('');
    const [image, setImage]=useState('');
    const [modalVisible, setModalVisible]=useState(false);

    const dispatch =useDispatch();

  // LOGIC FOR GENERATING THE ANIMATION ON SUCCESSFULL SIGNUP AND THEN NAVIGATE TO USERDASHBOARD
  const [submitted, setSubmitted]=useState(false);
  // const [loading, setLoading] = useState(true);
  // const [animationFinished, setAnimationFinished]=useState(false);



  const signUpUser = () => {
      // setLoading(true);

      fetch(`http://${addressIp}:3000/users/signup`, {
        method:'POST',
        headers: {'Content-Type': 'Application/json'}, 
        body: JSON.stringify({
          email:email,
          firstname:firstname,
          lastname:lastname,
          username: username,
          age:age,
          password: password,
          image:image,
        })
      })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        if (data.result) {
          setSubmitted(true);
          dispatch(addUserToStore(data.newUser))
        }else{
          alert(data.error)
        }
      })
      .catch((error) => {
        console.log(error)
      })
      // .finally(() => setLoading(false))
  };
  
  const handleAnimationFinish =() => {
    setSubmitted(false)
    setModalVisible(false)
    navigation.navigate("TabNavigator", { screen: "UserDashboard" })
    // setTimeout(() => {
    //   navigation.navigate("TabNavigator", { screen: "UserDashboard" })
    // }, 900);
  };

  return (
    <SafeAreaView style={styles.buttonWrapper}>
       <MyButton
        dataFlow={()=>setModalVisible(true)}
        text={"SIGN UP"}
        buttonType={buttonStyles.buttonOne}
      />
      <Modal visible={modalVisible} animationtType="fade" transparent>
        <View style={styles.modal}>
            {/* <View  style={styles.modalContainer}> */}
              {
                submitted ? 
                <LottieView
                source={require('../assets/Animation - 1723553895120.json')}
                autoPlay
                loop={false}
                onAnimationFinish={handleAnimationFinish}
                style={styles.lottieAnim}/> 
                : 
                <View style={styles.shadowView}> 
                <ScrollView style={styles.scroll} automaticallyAdjustKeyboardInsets={true}>
                
                <Text style={styles.modalTitle}>Register</Text>
                
                  {/*lire la doc pour specifier les options manquante */}
                  <TextInput placeholder='firstname' placeholderTextColor={'grey'}  style={styles.formStyle} value={firstname} onChangeText={(value)=> setFirstname(value)}/>
                  <TextInput placeholder='lastname' placeholderTextColor={'grey'}  style={styles.formStyle} value={lastname} onChangeText={(value)=> setLastname(value)}/>
                  <TextInput placeholder='username' placeholderTextColor={'grey'}  style={styles.formStyle} value={username} onChangeText={(value)=> setUsername(value)}/>
                  <TextInput placeholder='age' placeholderTextColor={'grey'}  style={styles.formStyle} value={age} onChangeText={(value)=> setAge(value)}/>
                  <TextInput placeholder='email' placeholderTextColor={'grey'}  KeyboardType={'email-address'} InputModeOptions={'email'} textContentType={'emailAddress'} autoCapitalize={'email'}  style={styles.formStyle} value={email} onChangeText={(value)=> setEmail(value)}/>
                  <TextInput placeholder='password' placeholderTextColor={'grey'} textContentType='password' autoComplete='new-password' secureTextEntry={true}  style={styles.formStyle} value={password} onChangeText={(value)=> setPassword(value)}/>
                  <TextInput placeholder='image' placeholderTextColor={'grey'}  style={styles.formStyle} value={image} onChangeText={(value)=> setImage(value)}/>
                  {/*Conditionally render the Lottie animation */}

                  <MyButton
                  dataFlow={() => signUpUser()}
                  text="Signup"
                  buttonType={buttonStyles.buttonThree}/>

            
                  
                  <MyButton
                    dataFlow={() => setModalVisible(false)}
                    text="Close"
                    buttonType={buttonStyles.buttonThree}
                  />
                   </ScrollView>
                  </View>
              }
         
            {/* </View> */}
        </View>
      </Modal>
    </SafeAreaView>
  );
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
      modalContainer: {
        backgroundColor: css.backgroundColorTwo,
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        width: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
        elevation: 5,
      },
      scroll:{
        backgroundColor: css.backgroundColorTwo,
        borderRadius: 20,
        padding: 20,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
        elevation: 5,
      },
      modalTitle:{
        justifyContent: 'center',
        alignItems:'center',
        color: css.inactiveButtonColor,
        fontWeight: "bold",
        fontFamily: css.fontFamilyOne,
        marginBottom: 5,
        
      },
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
  
  shadowView:{
    backgroundColor: '#abd1c6',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },

   
  lottieAnim:{
    width:'100%',
    height:'100%',
  },

})