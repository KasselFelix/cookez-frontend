import { StyleSheet, Text, View, TouchableOpacity, Image, ScrollView } from "react-native";
import React, { useRef } from "react";
import css from "../styles/Global";
import buttonStyles from "../styles/Button";
import MyButton from "../modules/MyButton";
import * as Unicons from '@iconscout/react-native-unicons';



export default function UserDashboardScreen({navigation}) {
  return (

    <View style={styles.container}>
      <View style={styles.logoBanner}>
       <Image
          style={styles.logo}
          source={require("../assets/logo/cookez logo.png")}
        />
      </View>
      <View style={styles.higherIcon}>
        <TouchableOpacity onPress={()=> navigation.navigate('Kickoff')}>
        <Unicons.UilCameraPlus size={60} color='white'/>
        </TouchableOpacity>
      </View>
      <View style={styles.lowerIcons}>
        {/* INSERT THE POPOVER FOR LOOKING FOR A RECIPE */}
        <TouchableOpacity name='wishList'>
          <Unicons.UilHeart style={styles.icons} size={40} color='white'/>
        </TouchableOpacity>
        <TouchableOpacity name='searchRecipe' onPress={()=> navigation.navigate('Kickoff')}>
          <Unicons.UilSearch style={styles.icons} size={50} color='white'/>
        </TouchableOpacity>
        <TouchableOpacity name='Profile'>
          <Unicons.UilUser style={styles.icons} size={40} color='white'/>
        </TouchableOpacity>
      </View>
      <View style={styles.titleBlock}>
        <Text style={styles.title}>Community</Text>

      </View>
      <View style={styles.lowerContainers}>
        <ScrollView style={styles.scrollView}>

        </ScrollView>
      </View>
      <View style={styles.lowerContainers}>
        <ScrollView style={styles.scrollView}>

        </ScrollView>
      </View>
      <View style={styles.buttons}>
        <MyButton
          dataFlow={() => navigation.navigate("AddRecipe")}
          text={"ADD RECIPE ✍🏽"}
          buttonType={buttonStyles.buttonTwo}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({

container:{
  flex:1,
  backgroundColor: css.backgroundColorOne,
},


logo:{
  alignItems:'center',
  margin:0,
  width:390,
  height:115,
  objectFit:'contain',
  alignSelf:'center',
  marginTop:'18%',
  marginBottom:15,
  shadowOffset: { width: 0, height:8 }, // Shadow offset for iOS
  shadowOpacity: 0.8,          // Shadow opacity for iOS
  shadowRadius: 3,  
  marginBottom:0,           // Shadow radius for iOS

},

higherIcon: {
  flex:0.1,
  alignSelf:'center',
  height:20,
 
},
lowerIcons:{
  flex:0.1,
  width:'100%',
  flexDirection: 'row',
  justifyContent:'space-around',
  marginBottom:10,

},
titleBlock:{
  flex:0,
  width:'100%',
  marginBottom:19,
},
title:{
  textAlign:'center',
  fontSize:20,
},


lowerContainers:{
  flex:0.29,
  backgroundColor:'transparent',
  borderWidth:2,
  width:'98%',
  borderRadius:15,
  marginHorizontal:'auto',
  padding:2,
  marginBottom:10,
  shadowOffset: { width: 0, height:8 }, // Shadow offset for iOS
  shadowOpacity: 0.8,          // Shadow opacity for iOS
  shadowRadius: 3,  
},
buttons:{

},
})