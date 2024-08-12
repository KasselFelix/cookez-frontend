import { StyleSheet, Text, View, Image } from 'react-native'
import React from 'react'
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context'
import css from "../styles/Global"
import buttonStyles from "../styles/Button";
import MyButton from "../modules/MyButton";
import MySmallButton from "../modules/MySmallButton";
import LottieView from "lottie-react-native";


import FontAwesome from "react-native-vector-icons/FontAwesome"

export default function MoreFeaturesScreen({navigation}) {




  return (
    <SafeAreaView style={styles.container}>
       <MySmallButton
        dataFlow={() => navigation.goBack()}
        text={
        <FontAwesome name="angle-double-left" size={30} color={"white"} />
        }
        buttonType={buttonStyles.buttonSmall}
      />
      <LottieView style={styles.lottieAnim} source={require("../assets/Animation - 1723426951688.json")}
      autoPlay
      loop
      />
    
      <View style={styles.buttons}>
          <MyButton
            dataFlow={() => navigation.navigate("Login")}
            text={"SIGN-UP"}
            buttonType={buttonStyles.buttonTwo}
          />
        </View>
        <View style={styles.buttons}>
          <MyButton
            dataFlow={() => navigation.navigate("Recipe")}
            text={"SKIP"}
            buttonType={buttonStyles.buttonTwo}
          />
        </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: css.backgroundColorOne,
    padding:7,
  },
  lottieAnim:{
    flex:0,
    justifyContent:'center',
    width:"98%",
    height:"70%",
  },
  buttons:{
    margin:6,
  },
  animationContainer:{
    height:'70%',
		width:'90%',
		marginBottom:10,
		borderRadius: 40,
		overflow: "hidden",
  },
  
})