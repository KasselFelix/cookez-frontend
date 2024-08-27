import { StyleSheet, View, Text } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import css from "../styles/Global"
import buttonStyles from "../styles/Button";
import MyButton from "../components/MyButton";
import MySmallButton from "../components/MySmallButton";
import LottieView from "lottie-react-native";

import FontAwesome from "react-native-vector-icons/FontAwesome"

export default function MoreFeaturesScreen({navigation}) {

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <MySmallButton
          dataFlow={() => navigation.goBack()}
          text={<FontAwesome name="angle-double-left" size={30} color={"white"} />}
          buttonType={buttonStyles.buttonSmall}
        />
        <View style={styles.btnEmpty}></View>
      </View>
      <LottieView style={styles.lottieAnim} source={require("../assets/animation/Animation - 1723426951688.json")}
      autoPlay
      loop
      />
    <View style={styles.featuresContainer}>
    <Text style={styles.title}>To fully enjoy all features, create your account now</Text>
      <Text style={styles.feature}>Like</Text>
      <Text style={styles.feature}>Comment</Text>
      <Text style={styles.feature}>Vote</Text>
      <Text style={styles.feature}>Create Recipes</Text>
      <Text style={styles.feature}>Save Preferences</Text>
    </View>
      <View style={styles.buttonsContainer}>
        <View style={styles.buttons}>
          <MyButton
            dataFlow={() => navigation.navigate("Login")}
            text={"SIGN-UP"}
            buttonType={buttonStyles.buttonTwo}
          />
        </View>
        <View style={styles.buttons}>
          <MyButton
            dataFlow={() => navigation.navigate("Home")}
            text={"SKIP"}
            buttonType={buttonStyles.buttonTwo}
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent:'center',
    // alignItems: 'center',
    // backgroundColor: css.backgroundColorOne,
    // padding:7,
    // paddingTop: 20,
    marginTop: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    transform: [{ perspective: 1000 }, { rotateX: '10deg' }, { rotateY: '10deg' }],
  },

  header: {
    flex: 0,
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  lottieAnim:{
    flex:0,
    justifyContent:'center',
    alignItems: 'center',
    width: '75%',
    height: '40%',
  },

  featuresContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    alignItems: 'center',
  },

  feature: {
    fontSize: 18,
    color: '#333',
    marginVertical: 5,
  },

  buttonsContainer: {
    height: 200,
    marginBottom: 15,
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