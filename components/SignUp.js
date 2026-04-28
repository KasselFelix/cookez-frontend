import LottieView from "lottie-react-native";
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import addressIp from '../modules/addressIp';
import { addUserToStore } from '../reducers/user';
import buttonStyles from '../styles/Button';
import css from '../styles/Global';
import MyButton from './MyButton';

export default function SignUp({navigation}) {
    const [email, setEmail]=useState('');
    const [firstname, setFirstname]=useState('');
    const [lastname, setLastname]=useState('');
    const [username, setUsername]=useState('');
    const [age, setAge]=useState(0); 
    const [password, setPassword]=useState('');
    const [modalVisible, setModalVisible]=useState(false);
    const [submitted, setSubmitted]=useState(false);

    const dispatch =useDispatch();



  const signUpUser = () => {
      // setLoading(true);

      fetch(`${addressIp}/users/signup`, {
        method:'POST',
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({
          email:email.trim(),
          firstname:firstname.trim(),
          lastname:lastname.trim(),
          username: username.trim(),
          age:age,
          password: password,
          image:'default_M',
          settings: {
            allergy: [],
            gender: null,
            householdComposition: 0,
          },
        })
      })
      .then((res) => res.json())
      .then((data) => {
        // console.log(data);
        if (data.result) {
          setSubmitted(true);
          dispatch(addUserToStore(data.newUser))
        }else{
          alert(data.error)
        }
      })
      .catch((error) => {
        //console.log(error)
      })
      // .finally(() => setLoading(false))
  };
  
  const handleAnimationFinish =() => {
    setSubmitted(false)
    setModalVisible(false)
    navigation.navigate("TabNavigator", { screen: "UserDashboard" })
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
                source={require('../assets/animation/Animation - 1723553895120.json')}
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

                  <MyButton
                  dataFlow={signUpUser}
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
    width: '100%',
    marginBottom: 5, 
  },
    modal:{
        flex:1,
        justifyContent:'center',
        alignItems:'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      },
      modalContainer: {
        backgroundColor: css.palette.secondary500,
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
      modalTitle:{
        justifyContent: 'center',
        alignItems:'center',
        color: css.palette.primary800,
        fontWeight: "bold",
        fontFamily: css.typography.fontHeading,
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